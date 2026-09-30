import { NextRequest, NextResponse } from "next/server";
import { localStorageEnabled, readJsonBody, requestOrigin, sameOrigin, storageConfigured } from "@/lib/shortcut-server";
import { adminConfigured, googleConfigured, authOrigin, beginGoogleLogin, cookieName, flowCookieName, isAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };

export function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: isAdmin(request), configured: googleConfigured(), adminRegistered: adminConfigured(), storage: storageConfigured(), localStorage: localStorageEnabled() }, { headers });
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "허용하지 않는 요청입니다." }, { status: 403, headers });
  if (!googleConfigured()) return NextResponse.json({ error: "Google 관리자 로그인 환경 변수를 먼저 설정해 주세요." }, { status: 503, headers });
  if (requestOrigin(request) !== authOrigin()) return NextResponse.json({ error: "Google 로그인이 설정된 사이트 주소에서 로그인해 주세요." }, { status: 400, headers });
  try {
    const body = await readJsonBody(request, 4096) as { returnTo?: unknown; password?: unknown };
    if (!body || typeof body !== "object" || "password" in body) return NextResponse.json({ error: "비밀번호 로그인은 지원하지 않습니다. Google 로그인을 사용해 주세요." }, { status: 400, headers });
    const login = beginGoogleLogin(body.returnTo);
    const response = NextResponse.json({ url: login.url }, { headers });
    response.cookies.set(flowCookieName, login.flow, { httpOnly: true, sameSite: "lax", secure: authOrigin().startsWith("https:"), path: "/api/shortcut-admin", maxAge: login.maxAge });
    response.cookies.set(cookieName, "", { httpOnly: true, sameSite: "strict", secure: authOrigin().startsWith("https:"), path: "/", maxAge: 0 });
    return response;
  } catch { return NextResponse.json({ error: "로그인 요청이 올바르지 않습니다." }, { status: 400, headers }); }
}
export function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "허용하지 않는 요청입니다." }, { status: 403 });
  const response = NextResponse.json({ authenticated: false }, { headers });
  response.cookies.set(cookieName, "", { httpOnly: true, sameSite: "strict", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 0 });
  response.cookies.set(flowCookieName, "", { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/api/shortcut-admin", maxAge: 0 });
  return response;
}
