import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin, readJsonBody, sameOrigin } from "@/lib/shortcut-server";
import { GuideConflictError, guideSource, loadGuide, saveGuide, type GuideKind } from "@/lib/guide-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ kind: string; slug: string }> };
function valid(kind: string, slug: string): kind is GuideKind {
  return (kind === "mechanics" || kind === "basic" || kind === "tracks") && Boolean(guideSource(kind, slug));
}
export async function GET(_request: NextRequest, { params }: Context) {
  const { kind, slug } = await params;
  if (!valid(kind, slug)) return NextResponse.json({ error: "항목을 찾을 수 없습니다." }, { status: 404 });
  try { return NextResponse.json(await loadGuide(kind, slug), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { console.error("Guide read failed", error); return NextResponse.json({ error: "설명 데이터를 읽지 못했습니다." }, { status: 500 }); }
}
export async function PUT(request: NextRequest, { params }: Context) {
  if (!sameOrigin(request) || !isAdmin(request)) return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  const { kind, slug } = await params;
  if (!valid(kind, slug)) return NextResponse.json({ error: "항목을 찾을 수 없습니다." }, { status: 404 });
  try {
    const result = await saveGuide(kind, slug, await readJsonBody(request, 512 * 1024), request.headers.get("if-match"));
    revalidatePath("/");
    revalidatePath(kind === "mechanics" ? "/mechanics" : kind === "basic" ? "/strategies/basic" : "/strategies/tracks");
    revalidatePath(kind === "mechanics" ? `/mechanics/${slug}` : kind === "basic" ? `/strategies/basic/${slug}` : `/tracks/${slug}/strategies`);
    if (kind === "tracks") { revalidatePath("/tracks"); revalidatePath(`/tracks/${slug}`); }
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof GuideConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
    if (error instanceof Error && !((error as NodeJS.ErrnoException).code)) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Guide save failed", error);
    return NextResponse.json({ error: "저장하지 못했습니다. 저장소 연결과 쓰기 권한을 확인해 주세요." }, { status: 500 });
  }
}
