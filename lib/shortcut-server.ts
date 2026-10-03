import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { get, head, put, BlobNotFoundError, BlobPreconditionFailedError } from "@vercel/blob";
import type { NextRequest } from "next/server";
import { parseBackup, publicationIssues, type ShortcutBackup } from "./shortcut-drafts";
import type { Track } from "../data/tracks";
import { publishedTrack } from "./shortcut-content";

export const localStorageEnabled = () => process.env.SHORTCUT_STORAGE === "local" && !process.env.VERCEL;
export const localStorageRoot = path.join(process.cwd(), ".shortcut-data");
export const storageConfigured = () => localStorageEnabled() || Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const blobRevision = (etag: string) => etag.replace(/^W\//, "");
export { cookieName, adminConfigured, isAdmin, sessionToken } from "./admin-auth";
export const requestOrigin = (request: NextRequest) => `${request.nextUrl.protocol}//${request.headers.get("host")}`;
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === requestOrigin(request); } catch { return false; }
}
export async function readJsonBody(request: Request, limit: number): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("요청 내용이 없습니다.");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); throw new Error("저장 용량을 초과했습니다. 영상은 링크로 연결하거나 파일 크기를 줄여 주세요."); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export async function loadShortcuts(slug: string, fresh = false) {
  if (localStorageEnabled()) {
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("올바르지 않은 트랙입니다.");
    let raw: string;
    try { raw = await readFile(path.join(localStorageRoot, `${slug}.json`), "utf8"); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return { data: null, revision: "empty" }; throw error; }
    return { data: parseBackup(JSON.parse(raw), slug), revision: createHash("sha256").update(raw).digest("hex") };
  }
  if (!storageConfigured()) return { data: null, revision: "empty" };
  const pathname = `shortcuts/content/${slug}.json`;
  let expectedRevision: string | null = null;
  let source = pathname;
  if (fresh) {
    try {
      const metadata = await head(pathname);
      expectedRevision = blobRevision(metadata.etag);
      const url = new URL(metadata.url);
      url.searchParams.set("revision", expectedRevision);
      source = url.toString();
    } catch (error) {
      if (error instanceof BlobNotFoundError) return { data: null, revision: "empty" };
      throw error;
    }
  }
  const result = await get(source, { access: "public" });
  if (!result) {
    if (expectedRevision) throw new Error("최신 공개 내용을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.");
    return { data: null, revision: "empty" };
  }
  if (result.statusCode !== 200) throw new Error("숏컷 데이터를 읽지 못했습니다.");
  const revision = blobRevision(result.blob.etag);
  if (expectedRevision && revision !== expectedRevision) throw new Error("최신 공개 내용을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.");
  return { data: parseBackup(await new Response(result.stream).json(), slug), revision };
}
export async function loadPublishedTrack(track: Track): Promise<Track> {
  const { data } = await loadShortcuts(track.slug);
  return publishedTrack(track, data);
}

export async function loadPublishedTracks(tracks: Track[]): Promise<Track[]> {
  // Bound concurrent storage reads; only compact summaries cross the client boundary.
  const result: Track[] = [];
  for (let index = 0; index < tracks.length; index += 8) {
    result.push(...await Promise.all(tracks.slice(index, index + 8).map(loadPublishedTrack)));
  }
  return result;
}

export class ShortcutConflictError extends Error {}

export async function saveShortcuts(slug: string, input: unknown, revision: string | null) {
  if (!storageConfigured()) throw new Error("Vercel Blob 저장소를 먼저 연결해 주세요.");
  const data = parseBackup(input, slug, false);
  const issues = publicationIssues(data.shortcuts);
  if (issues.length) throw new Error(issues.map((issue) => issue.message).join("\n"));
  if (!revision) throw new Error("페이지를 새로고침한 뒤 다시 저장해 주세요.");
  const previous = await loadShortcuts(slug, true);
  if (previous.revision !== revision) throw new ShortcutConflictError("다른 탭에서 공개 내용이 변경되었습니다. 내 초안은 유지됩니다. 최신 공개 내용을 확인해 주세요.");
  const stored: ShortcutBackup = { version: 1, track: slug, updatedAt: new Date().toISOString(),
    researchStatus: data.shortcuts.length ? "unreviewed" : data.researchStatus ?? (previous.data?.shortcuts.length === 0 ? previous.data.researchStatus : undefined) ?? "unreviewed",
    shortcuts: data.shortcuts.map((item) => ({
    id: item.id, title: item.title, summary: item.summary ?? "", difficulty: item.difficulty ?? null, requirements: item.requirements, video: item.video,
    steps: item.steps.map((step) => ({ id: step.id, text: step.text, caption: step.caption, image: step.image })),
  })) };
  if (localStorageEnabled()) {
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("올바르지 않은 트랙입니다.");
    await mkdir(localStorageRoot, { recursive: true });
    const lock = path.join(localStorageRoot, `${slug}.lock`);
    try { await mkdir(lock); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new ShortcutConflictError("다른 탭에서 저장이 진행 중입니다. 잠시 후 최신 공개 내용을 확인해 주세요."); throw error; }
    const temporary = path.join(localStorageRoot, `${slug}.${randomUUID()}.tmp`);
    try {
      if ((await loadShortcuts(slug)).revision !== revision) throw new ShortcutConflictError("다른 탭에서 공개 내용이 변경되었습니다. 내 초안은 유지됩니다. 최신 공개 내용을 확인해 주세요.");
      const raw = JSON.stringify(stored);
      await writeFile(temporary, raw, { flag: "wx" });
      await rename(temporary, path.join(localStorageRoot, `${slug}.json`));
      return { data: stored, revision: createHash("sha256").update(raw).digest("hex") };
    } finally { await rm(temporary, { force: true }); await rm(lock, { recursive: true }); }
  }
  try {
    const result = await put(`shortcuts/content/${slug}.json`, JSON.stringify(stored), {
      access: "public", contentType: "application/json", addRandomSuffix: false,
      allowOverwrite: revision !== "empty", ...(revision !== "empty" ? { ifMatch: revision } : {}), cacheControlMaxAge: 60,
    });
    return { data: stored, revision: blobRevision(result.etag) };
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError) throw new ShortcutConflictError("다른 탭에서 공개 내용이 변경되었습니다. 내 초안은 유지됩니다. 최신 공개 내용을 확인해 주세요.");
    throw error;
  }
}
