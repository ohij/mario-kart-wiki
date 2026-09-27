import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAdmin, readJsonBody, sameOrigin, storageConfigured } from "@/lib/shortcut-server";
import { tracks } from "@/data/tracks";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request, 16384) as HandleUploadBody;
    const response = await handleUpload({
      request, body,
      onBeforeGenerateToken: async (pathname) => {
        if (!sameOrigin(request) || !isAdmin(request)) throw new Error("관리자 로그인이 필요합니다.");
        if (!storageConfigured()) throw new Error("Vercel Blob 저장소를 먼저 연결해 주세요.");
        const match = /^shortcuts\/media\/([a-z0-9-]+)\/([a-f0-9-]+)\.(png|jpeg|webp|gif|mp4|webm|ogg)$/.exec(pathname);
        if (!match || !tracks.some((track) => track.slug === match[1])) throw new Error("허용하지 않는 업로드 경로입니다.");
        const image = ["png", "jpeg", "webp", "gif"].includes(match[3]);
        return { allowedContentTypes: [image ? `image/${match[3]}` : `video/${match[3]}`], maximumSizeInBytes: (image ? 10 : 100) * 1024 * 1024, addRandomSuffix: true, allowOverwrite: false, validUntil: Date.now() + 10 * 60 * 1000 };
      },
    });
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "업로드 권한이나 저장소 설정을 확인해 주세요. 로그인이 만료되었다면 다시 로그인해 주세요." }, { status: 400 });
  }
}
