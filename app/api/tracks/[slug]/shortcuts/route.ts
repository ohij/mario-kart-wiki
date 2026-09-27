import { NextRequest, NextResponse } from "next/server";
import { tracks } from "@/data/tracks";
import { isAdmin, loadShortcuts, readJsonBody, sameOrigin, saveShortcuts } from "@/lib/shortcut-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ slug: string }> };
export async function GET(_request: NextRequest, { params }: Context) {
  const { slug } = await params;
  if (!tracks.some((track) => track.slug === slug)) return NextResponse.json({ error: "트랙을 찾을 수 없습니다." }, { status: 404 });
  try { return NextResponse.json(await loadShortcuts(slug), { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ error: "숏컷 데이터를 읽지 못했습니다." }, { status: 500 }); }
}
export async function PUT(request: NextRequest, { params }: Context) {
  if (!sameOrigin(request) || !isAdmin(request)) return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  const { slug } = await params;
  if (!tracks.some((track) => track.slug === slug)) return NextResponse.json({ error: "트랙을 찾을 수 없습니다." }, { status: 404 });
  try {
    const result = await saveShortcuts(slug, await readJsonBody(request, 2 * 1024 * 1024), request.headers.get("if-match"));
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && !("code" in error)) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Shortcut save failed", error);
    return NextResponse.json({ error: "클라우드에 저장하지 못했습니다. Vercel Blob 연결과 사용량을 확인해 주세요." }, { status: 500 });
  }
}
