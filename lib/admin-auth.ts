import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import type { NextRequest } from "next/server";

export const cookieName = "mkw-admin";
export const flowCookieName = "mkw-google-flow";
export const sessionSeconds = 8 * 60 * 60;
const flowSeconds = 10 * 60;
const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"), { timeoutDuration: 10000 });

export class GoogleAuthError extends Error {
  constructor(public readonly code: "flow" | "token_invalid_client" | "token_invalid_grant" | "token_redirect" | "token_exchange" | "id_token") {
    super(code);
    this.name = "GoogleAuthError";
  }
}

export function googleConfigured() {
  try {
    const url = new URL(process.env.GOOGLE_REDIRECT_URI ?? "");
    return Boolean(process.env.GOOGLE_CLIENT_ID?.endsWith(".apps.googleusercontent.com") && process.env.GOOGLE_CLIENT_SECRET &&
      (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32 && url.pathname === "/api/shortcut-admin/callback" &&
      !url.username && !url.password && !url.search && !url.hash &&
      (url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))));
  } catch { return false; }
}
// Google documents sub as an opaque ASCII identifier, not necessarily a number.
const validSubject = (value: unknown): value is string => typeof value === "string" && /^[\x20-\x7e]{1,255}$/.test(value);
export const adminConfigured = () => googleConfigured() && validSubject(process.env.GOOGLE_ADMIN_SUB);
export const authOrigin = () => new URL(process.env.GOOGLE_REDIRECT_URI!).origin;
const equal = (left: string, right: string) => timingSafeEqual(createHash("sha256").update(left).digest(), createHash("sha256").update(right).digest());
const signature = (purpose: string, raw: string) => createHmac("sha256", process.env.ADMIN_SESSION_SECRET!).update(`${purpose}:${raw}`).digest("hex");

function sign(purpose: string, data: object) {
  const raw = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${raw}.${signature(purpose, raw)}`;
}
function read(purpose: string, token: string): Record<string, unknown> | null {
  if (!googleConfigured() || token.length > 4096) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !/^[\w-]+$/.test(parts[0]) || !/^[a-f0-9]{64}$/.test(parts[1]) || !equal(parts[1], signature(purpose, parts[0]))) return null;
  try {
    const data = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return data && typeof data === "object" && Number.isSafeInteger(data.exp) && data.exp > Date.now() && data.client === process.env.GOOGLE_CLIENT_ID ? data : null;
  } catch { return null; }
}
export function sessionToken(sub: string) {
  if (!adminConfigured() || sub !== process.env.GOOGLE_ADMIN_SUB) throw new Error("등록된 관리자 계정이 아닙니다.");
  return sign("google-admin-v2", { v: 2, sub, exp: Date.now() + sessionSeconds * 1000, client: process.env.GOOGLE_CLIENT_ID, id: randomBytes(24).toString("base64url") });
}
export function isAdmin(request: NextRequest) {
  if (!adminConfigured()) return false;
  const data = read("google-admin-v2", request.cookies.get(cookieName)?.value ?? "");
  return data?.v === 2 && data.sub === process.env.GOOGLE_ADMIN_SUB;
}
export function safeReturnTo(value: unknown) {
  return typeof value === "string" && (value === "/admin/content" || /^\/tracks\/[a-z0-9-]+\/(shortcuts|strategies)$/.test(value) || /^\/mechanics\/[a-z0-9-]+$/.test(value) || /^\/strategies\/basic\/[a-z0-9-]+$/.test(value)) ? value : "/admin/content";
}
export type GoogleFlow = { state: string; nonce: string; verifier: string; returnTo: string; redirect: string };
export function beginGoogleLogin(returnTo: unknown) {
  if (!googleConfigured()) throw new Error("Google 관리자 로그인 환경 변수를 설정해 주세요.");
  const state = randomBytes(32).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const redirect = process.env.GOOGLE_REDIRECT_URI!;
  const flow = sign("google-flow-v1", { state, nonce, verifier, returnTo: safeReturnTo(returnTo), redirect, client: process.env.GOOGLE_CLIENT_ID, exp: Date.now() + flowSeconds * 1000 });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  // During one-time setup no session can be issued, so use the browser's current
  // Google account and avoid account-chooser stalls in embedded browsers.
  // Once an admin subject is registered, always show the account chooser.
  const prompt = adminConfigured() ? "select_account" : "consent";
  const params = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, redirect_uri: redirect, response_type: "code", scope: "openid email", state, nonce, prompt, code_challenge: createHash("sha256").update(verifier).digest("base64url"), code_challenge_method: "S256" });
  if (!adminConfigured() && process.env.GOOGLE_ADMIN_EMAIL_HINT) params.set("login_hint", process.env.GOOGLE_ADMIN_EMAIL_HINT);
  url.search = params.toString();
  return { url: url.href, flow, maxAge: flowSeconds };
}
export function readGoogleFlow(token: string, state: string | null): GoogleFlow {
  const data = read("google-flow-v1", token);
  if (!data || !state || typeof data.state !== "string" || !equal(data.state, state) || typeof data.nonce !== "string" || typeof data.verifier !== "string" || data.redirect !== process.env.GOOGLE_REDIRECT_URI || data.returnTo !== safeReturnTo(data.returnTo)) throw new GoogleAuthError("flow");
  return data as unknown as GoogleFlow;
}
export async function verifyGoogleIdToken(token: string, nonce: string, keys: JWTVerifyGetKey = googleKeys) {
  try {
    const { payload } = await jwtVerify(token, keys, { issuer: ["https://accounts.google.com", "accounts.google.com"], audience: process.env.GOOGLE_CLIENT_ID, algorithms: ["RS256"], requiredClaims: ["sub", "iat", "exp", "nonce"], maxTokenAge: "10m", clockTolerance: 5 });
    if (!validSubject(payload.sub) || payload.nonce !== nonce || payload.email_verified !== true || typeof payload.email !== "string" || (payload.azp !== undefined && payload.azp !== process.env.GOOGLE_CLIENT_ID) || (Array.isArray(payload.aud) && payload.aud.length > 1 && payload.azp !== process.env.GOOGLE_CLIENT_ID)) throw new GoogleAuthError("id_token");
    return payload.sub;
  } catch (error) {
    if (error instanceof GoogleAuthError) throw error;
    throw new GoogleAuthError("id_token");
  }
}
export async function exchangeGoogleCode(code: string, flow: GoogleFlow) {
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: flow.redirect, grant_type: "authorization_code", code_verifier: flow.verifier }), signal: AbortSignal.timeout(15000), cache: "no-store", redirect: "error" });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const reason = data && typeof data.error === "string" ? data.error : "";
    if (reason === "invalid_client") throw new GoogleAuthError("token_invalid_client");
    if (reason === "invalid_grant") throw new GoogleAuthError("token_invalid_grant");
    if (reason === "redirect_uri_mismatch") throw new GoogleAuthError("token_redirect");
    throw new GoogleAuthError("token_exchange");
  }
  if (!data || typeof data.id_token !== "string") throw new GoogleAuthError("token_exchange");
  return verifyGoogleIdToken(data.id_token, flow.nonce);
}
