import { NextRequest, NextResponse } from "next/server";
import { adminConfigured, authOrigin, cookieName, exchangeGoogleCode, flowCookieName, GoogleAuthError, googleConfigured, readGoogleFlow, sessionSeconds, sessionToken } from "@/lib/admin-auth";
import { requestOrigin } from "@/lib/shortcut-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
  if (!googleConfigured()) return new NextResponse("Google 관리자 로그인 환경 변수를 먼저 설정해 주세요.", { status: 503, headers });
  let returnTo = "/admin/content";
  let response: NextResponse;
  let authenticated = false;
  try {
    if (requestOrigin(request) !== authOrigin()) throw new Error("Wrong origin");
    const flow = readGoogleFlow(request.cookies.get(flowCookieName)?.value ?? "", request.nextUrl.searchParams.get("state"));
    returnTo = flow.returnTo;
    const code = request.nextUrl.searchParams.get("code");
    if (request.nextUrl.searchParams.has("error")) {
      response = NextResponse.redirect(new URL(`${returnTo}?authError=cancelled`, authOrigin()));
    } else {
      if (!code || code.length > 16384) throw new Error("Invalid code");
      const sub = await exchangeGoogleCode(code, flow);
      if (!adminConfigured()) {
        // Setup never grants a session. Only the account holder sees their verified ID.
        response = new NextResponse(`Google 계정 확인을 완료했습니다.\n\nGOOGLE_ADMIN_SUB=${sub}\n\n본인의 계정인지 확인한 뒤 이 값을 서버 환경 변수에 등록하고 재시작/재배포하세요.\n관리자 권한은 아직 발급하지 않았습니다.\n계정에 패스키 또는 2단계 인증을 설정해 주세요.`, { status: 403, headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" } });
      } else if (sub !== process.env.GOOGLE_ADMIN_SUB) {
        response = NextResponse.redirect(new URL(`${returnTo}?authError=forbidden`, authOrigin()));
      } else {
        response = NextResponse.redirect(new URL(returnTo, authOrigin()));
        response.cookies.set(cookieName, sessionToken(sub), { httpOnly: true, sameSite: "strict", secure: authOrigin().startsWith("https:"), path: "/", maxAge: sessionSeconds });
        authenticated = true;
      }
    }
  } catch (error) {
    const reason = error instanceof GoogleAuthError ? error.code : "callback";
    response = NextResponse.redirect(new URL(`${returnTo}?authError=failed&authReason=${reason}`, authOrigin()));
  }
  for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
  if (!authenticated) response.cookies.set(cookieName, "", { httpOnly: true, sameSite: "strict", secure: authOrigin().startsWith("https:"), path: "/", maxAge: 0 });
  response.cookies.set(flowCookieName, "", { httpOnly: true, sameSite: "lax", secure: authOrigin().startsWith("https:"), path: "/api/shortcut-admin", maxAge: 0 });
  return response;
}
