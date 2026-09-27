import { NextRequest, NextResponse } from "next/server";
import { adminConfigured, cookieName, isAdmin, readJsonBody, sameOrigin, sessionToken, storageConfigured, validPassword } from "@/lib/shortcut-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
let failures = 0;
let resetAt = 0;

export function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: isAdmin(request), configured: adminConfigured(), storage: storageConfigured() }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "허용하지 않는 요청입니다." }, { status: 403 });
  if (!adminConfigured()) return NextResponse.json({ error: "서버에 관리자 비밀번호를 먼저 설정해 주세요." }, { status: 503 });
  if (Date.now() > resetAt) { failures = 0; resetAt = Date.now() + 15 * 60 * 1000; }
  if (failures >= 10) return NextResponse.json({ error: "로그인 시도가 많습니다. 15분 후 다시 시도해 주세요." }, { status: 429 });
  try {
    const body = await readJsonBody(request, 4096) as { password?: unknown };
    if (typeof body?.password !== "string" || !validPassword(body.password)) {
      failures++;
      return NextResponse.json({ error: "관리자 비밀번호가 올바르지 않습니다." }, { status: 401 });
    }
    failures = 0;
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(cookieName, sessionToken(), { httpOnly: true, sameSite: "strict", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 8 * 60 * 60 });
    return response;
  } catch { return NextResponse.json({ error: "로그인 요청이 올바르지 않습니다." }, { status: 400 }); }
}
export function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "허용하지 않는 요청입니다." }, { status: 403 });
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(cookieName, "", { path: "/", maxAge: 0 });
  return response;
}
