import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAdmin, readJsonBody, sameOrigin, storageConfigured, localStorageEnabled, localStorageRoot } from "@/lib/shortcut-server";
import { mkdir, open, rm } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { tracks } from "@/data/tracks";
import { guideSource, type GuideKind } from "@/lib/guide-content";

export const runtime = "nodejs";
export async function PUT(request: NextRequest) {
  if (!sameOrigin(request) || !isAdmin(request)) return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  if (!localStorageEnabled()) return NextResponse.json({ error: "로컬 저장소가 설정되지 않았습니다." }, { status: 400 });
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  const kind = request.nextUrl.searchParams.get("kind");
  if (kind ? !(["mechanics", "basic", "tracks"].includes(kind) && guideSource(kind as GuideKind, slug)) : !tracks.some(track => track.slug === slug)) return NextResponse.json({ error: "항목을 찾을 수 없습니다." }, { status: 404 });
  const mime = request.headers.get("content-type") ?? "";
  if (!/^(image\/(png|jpeg|webp|gif)|video\/(mp4|webm|ogg))$/.test(mime) || !request.body) return NextResponse.json({ error: "지원하지 않는 파일 형식입니다." }, { status: 400 });
  const limit = (mime.startsWith("image/") ? 10 : 100) * 1024 * 1024;
  const name = `${randomUUID()}.${mime.split("/")[1]}`;
  const directory = path.join(localStorageRoot, "media");
  const filename = path.join(directory, name);
  try {
    await mkdir(directory, { recursive: true });
    const file = await open(filename, "wx");
    let size = 0;
    try {
      const reader = request.body.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > limit) { await reader.cancel(); throw new Error("파일 크기 제한을 초과했습니다."); }
        await file.writeFile(value);
      }
      if (!size) throw new Error("빈 파일은 업로드할 수 없습니다.");
    } finally { await file.close(); }
    return NextResponse.json({ url: `/api/shortcut-media/${name}` });
  } catch (error) {
    await rm(filename, { force: true });
    console.error("Local upload failed", error);
    return NextResponse.json({ error: "파일 업로드에 실패했습니다. 파일 크기와 로컬 저장 폴더의 쓰기 권한을 확인해 주세요." }, { status: 400 });
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request, 16384) as HandleUploadBody;
    const response = await handleUpload({
      request, body,
      onBeforeGenerateToken: async (pathname) => {
        if (!sameOrigin(request) || !isAdmin(request)) throw new Error("관리자 로그인이 필요합니다.");
        if (!storageConfigured()) throw new Error("Vercel Blob 저장소를 먼저 연결해 주세요.");
        const shortcut = /^shortcuts\/media\/([a-z0-9-]+)\/([a-f0-9-]+)\.(png|jpeg|webp|gif|mp4|webm|ogg)$/.exec(pathname);
        const guide = /^guides\/media\/(mechanics|basic|tracks)\/([a-z0-9-]+)\/([a-f0-9-]+)\.(png|jpeg|webp|gif|mp4|webm|ogg)$/.exec(pathname);
        if (!((shortcut && tracks.some((track) => track.slug === shortcut[1])) || (guide && guideSource(guide[1] as GuideKind, guide[2])))) throw new Error("허용하지 않는 업로드 경로입니다.");
        const extension = shortcut?.[3] ?? guide![4];
        const image = ["png", "jpeg", "webp", "gif"].includes(extension);
        return { allowedContentTypes: [image ? `image/${extension}` : `video/${extension}`], maximumSizeInBytes: (image ? 10 : 100) * 1024 * 1024, addRandomSuffix: true, allowOverwrite: false, validUntil: Date.now() + 10 * 60 * 1000 };
      },
    });
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "업로드 권한이나 저장소 설정을 확인해 주세요. 로그인이 만료되었다면 다시 로그인해 주세요." }, { status: 400 });
  }
}
