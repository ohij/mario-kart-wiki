import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, put, BlobPreconditionFailedError } from "@vercel/blob";
import { basicStrategies, mechanics, type KnowledgeSection, type KnowledgeTopic } from "@/data/knowledge";
import { tracks, type Track } from "@/data/tracks";
import { localStorageEnabled, localStorageRoot, storageConfigured } from "./shortcut-server";
import { safeMedia, youtubeEmbed } from "./shortcut-drafts";

export type GuideKind = "mechanics" | "basic" | "tracks";
export type GuideMedia = { image?: string; caption?: string; video?: string };
export type GuideContent = { description: string; sections: KnowledgeSection[] } | { strategies: string[]; media?: GuideMedia[] };
type StoredGuide = { version: 1; kind: GuideKind; slug: string; updatedAt: string; content: GuideContent };
export class GuideConflictError extends Error {}

export function guideSource(kind: GuideKind, slug: string): KnowledgeTopic | Track | undefined {
  return kind === "mechanics" ? mechanics.find((item) => item.slug === slug)
    : kind === "basic" ? basicStrategies.find((item) => item.slug === slug)
    : tracks.find((item) => item.slug === slug);
}
export function initialGuide(kind: GuideKind, slug: string): GuideContent {
  const source = guideSource(kind, slug);
  if (!source) throw new Error("항목을 찾을 수 없습니다.");
  return kind === "tracks" ? { strategies: (source as Track).strategies } : {
    description: (source as KnowledgeTopic).description, sections: (source as KnowledgeTopic).sections,
  };
}
function parseGuide(input: unknown, kind: GuideKind): GuideContent {
  if (!input || typeof input !== "object") throw new Error("올바른 설명 데이터가 아닙니다.");
  const value = input as Record<string, unknown>;
  const parseMedia = (input: unknown): GuideMedia => {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("미디어 데이터가 올바르지 않습니다.");
    const fields = input as Record<string, unknown>;
    for (const key of ["image", "caption", "video"]) {
      if (fields[key] !== undefined && (typeof fields[key] !== "string" || fields[key].length > 2048)) throw new Error("미디어 주소와 이미지 설명은 2048자 이하로 작성해 주세요.");
    }
    const image = fields.image as string | undefined;
    const video = fields.video as string | undefined;
    if (image && !safeMedia(image, "image")) throw new Error("이미지는 HTTPS 주소 또는 업로드한 파일을 사용해 주세요.");
    if (video && (!safeMedia(video, "video") || (["youtube.com", "m.youtube.com", "youtu.be"].includes((() => { try { return new URL(video).hostname.replace(/^www\./, ""); } catch { return ""; } })()) && !youtubeEmbed(video)))) throw new Error("영상은 올바른 YouTube 링크, HTTPS 주소 또는 업로드한 파일을 사용해 주세요.");
    return Object.fromEntries(["image", "caption", "video"].filter((key) => fields[key] !== undefined).map((key) => [key, (fields[key] as string).trim()])) as GuideMedia;
  };
  if (kind === "tracks") {
    if (!Array.isArray(value.strategies) || value.strategies.length > 50 || value.strategies.some((item) => typeof item !== "string" || !item.trim() || item.length > 4000)) throw new Error("전략은 빈 항목 없이 50개 이하, 각 4000자 이하로 작성해 주세요.");
    if (value.media !== undefined && (!Array.isArray(value.media) || value.media.length !== value.strategies.length)) throw new Error("전략 미디어 개수가 전략 개수와 일치하지 않습니다.");
    return { strategies: value.strategies.map((item: string) => item.trim()), ...(value.media === undefined ? {} : { media: (value.media as unknown[]).map(parseMedia) }) };
  }
  if (typeof value.description !== "string" || value.description.length > 2000 || !Array.isArray(value.sections) || value.sections.length > 30 || value.sections.some((item) => !item || typeof item.title !== "string" || !item.title.trim() || item.title.length > 200 || typeof item.text !== "string" || !item.text.trim() || item.text.length > 10000)) throw new Error("요약은 2000자 이하, 설명은 제목과 본문을 채운 30개 이하 항목으로 작성해 주세요.");
  return { description: value.description.trim(), sections: value.sections.map((item: KnowledgeSection) => ({ title: item.title.trim(), text: item.text.trim(), ...parseMedia(item) })) };
}
const filePath = (kind: GuideKind, slug: string) => path.join(localStorageRoot, "guides", kind, `${slug}.json`);
const blobPath = (kind: GuideKind, slug: string) => `guides/content/${kind}/${slug}.json`;
export async function loadGuide(kind: GuideKind, slug: string) {
  if (!guideSource(kind, slug)) throw new Error("항목을 찾을 수 없습니다.");
  let raw: string | null = null; let revision = "empty";
  if (localStorageEnabled()) {
    try { raw = await readFile(filePath(kind, slug), "utf8"); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    if (raw !== null) revision = createHash("sha256").update(raw).digest("hex");
  } else if (storageConfigured()) {
    const result = await get(blobPath(kind, slug), { access: "public", useCache: false });
    if (result) {
      if (result.statusCode !== 200) throw new Error("설명 데이터를 읽지 못했습니다.");
      raw = await new Response(result.stream).text(); revision = result.blob.etag;
    }
  }
  if (raw === null) return { data: null, content: initialGuide(kind, slug), revision };
  const stored = JSON.parse(raw) as StoredGuide;
  if (stored.version !== 1 || stored.kind !== kind || stored.slug !== slug) throw new Error("저장된 설명 데이터의 형식이 올바르지 않습니다.");
  return { data: stored, content: parseGuide(stored.content, kind), revision };
}
export async function saveGuide(kind: GuideKind, slug: string, input: unknown, revision: string | null) {
  if (!storageConfigured()) throw new Error("저장소를 먼저 연결해 주세요.");
  if (!revision) throw new Error("페이지를 새로고침한 뒤 다시 저장해 주세요.");
  const content = parseGuide(input, kind);
  if ((await loadGuide(kind, slug)).revision !== revision) throw new GuideConflictError("다른 탭에서 내용이 변경되었습니다. 작성 중인 내용은 유지됩니다. 최신 공개 내용을 확인해 주세요.");
  const data: StoredGuide = { version: 1, kind, slug, updatedAt: new Date().toISOString(), content };
  const raw = JSON.stringify(data);
  if (localStorageEnabled()) {
    const destination = filePath(kind, slug);
    await mkdir(path.dirname(destination), { recursive: true });
    const lock = `${destination}.lock`;
    try { await mkdir(lock); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new GuideConflictError("다른 탭에서 저장 중입니다. 잠시 후 다시 시도해 주세요."); throw error; }
    const temporary = `${destination}.${randomUUID()}.tmp`;
    try {
      if ((await loadGuide(kind, slug)).revision !== revision) throw new GuideConflictError("다른 탭에서 내용이 변경되었습니다. 최신 공개 내용을 확인해 주세요.");
      await writeFile(temporary, raw, { flag: "wx" }); await rename(temporary, destination);
      return { data, content, revision: createHash("sha256").update(raw).digest("hex") };
    } finally { await rm(temporary, { force: true }); await rm(lock, { recursive: true }); }
  }
  try {
    const result = await put(blobPath(kind, slug), raw, { access: "public", contentType: "application/json", addRandomSuffix: false, allowOverwrite: revision !== "empty", ...(revision !== "empty" ? { ifMatch: revision } : {}), cacheControlMaxAge: 60 });
    return { data, content, revision: result.etag };
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError) throw new GuideConflictError("다른 탭에서 내용이 변경되었습니다. 최신 공개 내용을 확인해 주세요.");
    throw error;
  }
}
export async function publishedTopic(kind: "mechanics" | "basic", topic: KnowledgeTopic): Promise<KnowledgeTopic> {
  const { content } = await loadGuide(kind, topic.slug);
  return { ...topic, ...(content as { description: string; sections: KnowledgeTopic["sections"] }) };
}
export async function publishedTracks(catalog: Track[]): Promise<Track[]> {
  const result: Track[] = [];
  for (let index = 0; index < catalog.length; index += 8) {
    result.push(...await Promise.all(catalog.slice(index, index + 8).map(async (track) => ({ ...track, strategies: ((await loadGuide("tracks", track.slug)).content as { strategies: string[] }).strategies }))));
  }
  return result;
}
