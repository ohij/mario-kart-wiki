import { readFile, writeFile, stat, realpath } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { put } from "@vercel/blob";

// Reuse the editor/server's schema instead of maintaining a second validator.
const source = await readFile(new URL("../lib/shortcut-drafts.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { parseBackup, publicationIssues } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
const catalog = JSON.parse(await readFile(new URL("../data/track-catalog.json", import.meta.url), "utf8"));
const slugs = new Set(catalog.map((track) => track.slug));

export function parseFullBackup(input) {
  if (input?.version !== 1 || !Array.isArray(input.tracks) || input.tracks.length !== slugs.size) throw new Error("40개 트랙의 version 1 전체 백업이 필요합니다.");
  const seen = new Set();
  for (const row of input.tracks) {
    if (!slugs.has(row?.slug) || seen.has(row.slug) || typeof row.saved !== "boolean") throw new Error("트랙 slug 또는 저장 상태가 잘못되었습니다.");
    seen.add(row.slug);
    parseBackup(row.content, row.slug);
    const issues = publicationIssues(row.content.shortcuts);
    if (issues.length) throw new Error(`${row.slug}: ${issues.map((issue) => issue.message).join(" / ")}`);
    if (Buffer.byteLength(JSON.stringify(row.content)) > 2 * 1024 * 1024) throw new Error(`${row.slug}: 설명은 2MB 이하로 작성해 주세요.`);
  }
  return structuredClone(input);
}

export function localMediaReferences(backup) {
  const refs = new Map();
  for (const row of backup.tracks) {
    for (const item of row.content.shortcuts) {
      for (const url of [item.video, ...item.steps.map((step) => step.image)]) {
        if (url.startsWith("/api/shortcut-media/")) refs.set(url, { name: url.split("/").at(-1), slug: row.slug });
      }
    }
  }
  return refs;
}

export function replaceMedia(backup, mapping) {
  const result = structuredClone(backup);
  for (const row of result.tracks) for (const item of row.content.shortcuts) {
    item.video = mapping[item.video] ?? item.video;
    for (const step of item.steps) step.image = mapping[step.image] ?? step.image;
  }
  return parseFullBackup(result);
}

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, { ...options, redirect: "error", signal: AbortSignal.timeout(60000) });
  const data = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${data.error ?? "요청 실패"}`);
  return { response, data };
}

export async function restoreBackup(input, base, { apply = false, cookie, recoveryFile } = {}) {
  const backup = parseFullBackup(input);
  const url = new URL(base);
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash || !(url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))) throw new Error("HTTPS origin 또는 localhost HTTP origin을 입력해 주세요.");
  const origin = url.origin;
  const refs = localMediaReferences(backup);
  if (refs.size && !["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("로컬 미디어 주소가 있습니다. 배포 서버에 복원하기 전에 migrate로 이전해 주세요.");
  for (const media of refs.keys()) {
    const response = await fetch(`${origin}${media}`, { headers: { Range: "bytes=0-0" }, redirect: "error", signal: AbortSignal.timeout(60000) });
    await response.body?.cancel();
    if (![200, 206].includes(response.status)) throw new Error(`로컬 미디어 원본을 먼저 복구해 주세요: ${media}`);
  }
  // Read all revisions before any writes. If another editor saves later, If-Match fails.
  const rows = backup.tracks.filter((row) => row.saved);
  const revisions = new Map();
  for (const row of rows) {
    const { data } = await jsonRequest(`${origin}/api/tracks/${row.slug}/shortcuts`);
    if (typeof data.revision !== "string" || !data.revision) throw new Error(`${row.slug}: 공개 버전을 읽지 못했습니다.`);
    revisions.set(row.slug, data.revision);
  }
  console.log(`${apply ? "복원" : "사전 점검"}: ${origin}, 저장된 ${rows.length}개 트랙. saved=false 트랙은 변경하지 않습니다.`);
  if (!apply) return { restored: [], planned: rows.map((row) => row.slug) };
  if (!cookie || !/^mkw-admin=[\w-]+\.[a-f0-9]{64}$/.test(cookie) || !recoveryFile) throw new Error("--apply에는 Google 로그인 후 저장한 --cookie-file과 --recovery(현재 서버의 복구 백업 파일)가 필요합니다.");
  const headers = { Origin: origin, Cookie: cookie };
  const { data: auth } = await jsonRequest(`${origin}/api/shortcut-admin`, { headers });
  if (!auth.authenticated) throw new Error("Google 관리자 세션이 만료되었거나 등록된 계정이 아닙니다. 다시 로그인해 주세요.");
  const restored = [];
  try {
    const { data: recovery } = await jsonRequest(`${origin}/api/admin/content?backup=1`, { headers });
    await writeFile(recoveryFile, JSON.stringify(parseFullBackup(recovery), null, 2), { flag: "wx" });
    for (const row of rows) {
      const { data } = await jsonRequest(`${origin}/api/tracks/${row.slug}/shortcuts`, { method: "PUT", headers: { ...headers, "Content-Type": "application/json", "If-Match": revisions.get(row.slug) }, body: JSON.stringify(row.content) });
      restored.push(row.slug);
      const { data: checked } = await jsonRequest(`${origin}/api/tracks/${row.slug}/shortcuts`);
      if (checked.revision !== data.revision || JSON.stringify(checked.data) !== JSON.stringify(data.data)) throw new Error(`${row.slug}: 저장 후 재조회가 일치하지 않습니다.`);
      console.log(`복원·재조회 완료: ${row.slug}`);
    }
    return { restored };
  } catch (error) {
    throw new Error(`${error.message}\n복원 완료: ${restored.join(", ") || "없음"}. 전체 복원은 원자적이지 않습니다. 복구 백업: ${recoveryFile}`, { cause: error });
  }
}

async function migrateBackup(backup, options) {
  if (!options.media || !options.out) throw new Error("migrate에는 --media와 --out이 필요합니다.");
  const refs = localMediaReferences(backup);
  const directory = await realpath(options.media);
  const files = [];
  for (const [url, ref] of refs) {
    const filename = await realpath(path.join(directory, ref.name));
    if (path.dirname(filename) !== directory) throw new Error(`미디어 경로가 폴더 밖을 가리킵니다: ${ref.name}`);
    const info = await stat(filename);
    const extension = ref.name.split(".").at(-1);
    const image = ["png", "jpeg", "webp", "gif"].includes(extension);
    if (!info.isFile() || info.size === 0 || info.size > (image ? 10 : 100) * 1024 * 1024) throw new Error(`미디어 파일 크기/형식 오류: ${ref.name}`);
    files.push({ url, filename, ref, mime: `${image ? "image" : "video"}/${extension}`, size: info.size });
  }
  console.log(`${options.apply ? "이전" : "사전 점검"}: 로컬 미디어 ${files.length}개, ${files.reduce((sum, file) => sum + file.size, 0)} bytes`);
  if (!options.apply) return;
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN이 필요합니다.");
  // Reserve the output before uploading; never overwrite an existing backup.
  await writeFile(options.out, "", { flag: "wx" });
  const mapping = {};
  try {
    for (const file of files) {
      const uploaded = await put(`shortcuts/media/${file.ref.slug}/${file.ref.name}`, await readFile(file.filename), { access: "public", contentType: file.mime, addRandomSuffix: true, allowOverwrite: false });
      mapping[file.url] = uploaded.url;
      const response = await fetch(uploaded.url, { headers: { Range: "bytes=0-0" }, signal: AbortSignal.timeout(60000) });
      await response.body?.cancel();
      if (![200, 206].includes(response.status)) throw new Error(`이전 미디어 재조회 실패: ${file.ref.name}`);
      await writeFile(options.out, JSON.stringify({ migrationIncomplete: true, mapping }, null, 2));
    }
    await writeFile(options.out, JSON.stringify(replaceMedia(backup, mapping), null, 2));
    console.log(`이전 백업 생성: ${options.out}. 원본과 공개 설명은 변경하지 않았습니다.`);
  } catch (error) {
    await writeFile(options.out, JSON.stringify({ migrationIncomplete: true, mapping, error: error.message }, null, 2));
    throw new Error(`이전 중단: ${error.message}. 업로드된 주소는 ${options.out}에 기록했습니다. 원본 미디어를 보관하세요.`, { cause: error });
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const options = {};
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--apply") { options.apply = true; continue; }
    if (!["--backup", "--media", "--out", "--base", "--recovery", "--cookie-file"].includes(args[index]) || !args[index + 1] || args[index + 1].startsWith("--")) throw new Error("인자를 확인해 주세요: --backup, --media, --out, --base, --recovery, --cookie-file, --apply");
    options[args[index].slice(2)] = args[++index];
  }
  if (!["migrate", "restore"].includes(command) || !options.backup) throw new Error("사용법: npm run shortcuts:maintenance -- migrate|restore --backup <전체 JSON> [옵션]. 기본은 쓰기 없는 사전 점검입니다.");
  const backup = parseFullBackup(JSON.parse(await readFile(options.backup, "utf8")));
  if (command === "migrate") await migrateBackup(backup, options);
  else {
    if (!options.base) throw new Error("restore에는 --base가 필요합니다.");
    const cookie = options["cookie-file"] ? (await readFile(options["cookie-file"], "utf8")).trim() : undefined;
    await restoreBackup(backup, options.base, { apply: options.apply, cookie, recoveryFile: options.recovery });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
