import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { get, put, BlobPreconditionFailedError } from "@vercel/blob";
import type { NextRequest } from "next/server";
import { parseBackup, type ShortcutBackup } from "./shortcut-drafts";

export const storageConfigured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
export const cookieName = "mkw-admin";
export const adminConfigured = () => (process.env.SHORTCUT_ADMIN_PASSWORD?.length ?? 0) >= 16;
const digest = (value: string) => createHash("sha256").update(value).digest();
export function validPassword(value: string) { return adminConfigured() && timingSafeEqual(digest(value), digest(process.env.SHORTCUT_ADMIN_PASSWORD!)); }
const signature = (value: string) => createHmac("sha256", process.env.SHORTCUT_ADMIN_PASSWORD!).update(`shortcut-admin:${value}`).digest("hex");
export function sessionToken() { const expires = String(Date.now() + 8 * 60 * 60 * 1000); return `${expires}.${signature(expires)}`; }
export function isAdmin(request: NextRequest) {
  if (!adminConfigured()) return false;
  const token = request.cookies.get(cookieName)?.value ?? "";
  const [expires, signed] = token.split(".");
  return /^\d+$/.test(expires ?? "") && Number(expires) > Date.now() && /^[a-f0-9]{64}$/.test(signed ?? "") && timingSafeEqual(Buffer.from(signed, "hex"), Buffer.from(signature(expires), "hex"));
}
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).host === request.headers.get("host"); } catch { return false; }
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
export async function loadShortcuts(slug: string) {
  if (!storageConfigured()) return { data: null, revision: "empty" };
  const result = await get(`shortcuts/content/${slug}.json`, { access: "public", useCache: false });
  if (!result) return { data: null, revision: "empty" };
  if (result.statusCode !== 200) throw new Error("숏컷 데이터를 읽지 못했습니다.");
  return { data: parseBackup(await new Response(result.stream).json(), slug), revision: result.blob.etag };
}
export async function saveShortcuts(slug: string, input: unknown, revision: string | null) {
  if (!storageConfigured()) throw new Error("Vercel Blob 저장소를 먼저 연결해 주세요.");
  const data = parseBackup(input, slug);
  if (!revision) throw new Error("페이지를 새로고침한 뒤 다시 저장해 주세요.");
  const stored: ShortcutBackup = { version: 1, track: slug, shortcuts: data.shortcuts.map((item) => ({
    id: item.id, title: item.title, requirements: item.requirements, video: item.video,
    steps: item.steps.map((step) => ({ id: step.id, text: step.text, caption: step.caption, image: step.image })),
  })) };
  try {
    const result = await put(`shortcuts/content/${slug}.json`, JSON.stringify(stored), {
      access: "public", contentType: "application/json", addRandomSuffix: false,
      allowOverwrite: revision !== "empty", ...(revision !== "empty" ? { ifMatch: revision } : {}), cacheControlMaxAge: 60,
    });
    return { data: stored, revision: result.etag };
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError) throw new Error("다른 탭에서 내용이 변경되었습니다. 현재 내용을 백업한 뒤 새로고침해 주세요.");
    throw error;
  }
}
