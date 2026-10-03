import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { tracks } from "@/data/tracks";
import { isAdmin, loadShortcuts, readJsonBody, sameOrigin, saveShortcuts, ShortcutConflictError } from "@/lib/shortcut-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ slug: string }> };
export async function GET(request: NextRequest, { params }: Context) {
  const { slug } = await params;
  if (!tracks.some((track) => track.slug === slug)) return NextResponse.json({ error: "트랙을 찾을 수 없습니다." }, { status: 404 });
  try { return NextResponse.json(await loadShortcuts(slug, isAdmin(request)), { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ error: "숏컷 데이터를 읽지 못했습니다." }, { status: 500 }); }
}
export async function PUT(request: NextRequest, { params }: Context) {
  if (!sameOrigin(request) || !isAdmin(request)) return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  const { slug } = await params;
  if (!tracks.some((track) => track.slug === slug)) return NextResponse.json({ error: "트랙을 찾을 수 없습니다." }, { status: 404 });
  try {
    const result = await saveShortcuts(slug, await readJsonBody(request, 2 * 1024 * 1024), request.headers.get("if-match"));
    revalidatePath("/");
    revalidatePath("/tracks");
    revalidatePath(`/tracks/${slug}`);
    revalidatePath(`/tracks/${slug}/shortcuts`);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ShortcutConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
    if (error instanceof Error && !("code" in error)) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Shortcut save failed", error);
    return NextResponse.json({ error: "저장하지 못했습니다. 저장소 연결 또는 로컬 저장 폴더의 권한과 남은 공간을 확인해 주세요." }, { status: 500 });
  }
}
