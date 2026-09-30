import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createRequire } from "node:module";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import { generateKeyPair, SignJWT, createLocalJWKSet, exportJWK } from "jose";

const require = createRequire(import.meta.url);
// Execute the actual server module with only the external Blob transport replaced.
// Local files and HTTP integration tests use real I/O; no user storage is touched.
async function serverModule(env, root, blob = {}, target = "shortcut-server") {
  const cache = new Map();
  async function load(name) {
    if (cache.has(name)) return cache.get(name);
    const source = await readFile(new URL(`../lib/${name}.ts`, import.meta.url), "utf8");
    const dependencies = {};
    if (name === "shortcut-server") {
      dependencies["./shortcut-drafts"] = await load("shortcut-drafts");
      dependencies["./shortcut-content"] = await load("shortcut-content");
      dependencies["./admin-auth"] = await load("admin-auth");
    }
    const compiled = { exports: {} };
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    vm.runInNewContext(code, { module: compiled, exports: compiled.exports, require: (id) => id === "@vercel/blob" ? blob : dependencies[id] ?? require(id), process: { env, cwd: () => root }, Buffer, Response, Date, URL, URLSearchParams, crypto: globalThis.crypto, TextEncoder });
    cache.set(name, compiled.exports);
    return compiled.exports;
  }
  return load(target);
}
const authEnv = () => ({ GOOGLE_CLIENT_ID: "test.apps.googleusercontent.com", GOOGLE_CLIENT_SECRET: "test-only-client-secret", GOOGLE_REDIRECT_URI: "http://localhost:3000/api/shortcut-admin/callback", GOOGLE_ADMIN_SUB: "123456789", ADMIN_SESSION_SECRET: "test-only-session-secret-at-least-32-characters" });
const request = (token, origin = "http://localhost:3000") => ({ cookies: { get: () => ({ value: token }) }, headers: new Headers({ origin, host: "localhost:3000" }), nextUrl: new URL("http://localhost:3000") });
const content = { version: 1, track: "test-track", shortcuts: [{ id: "one", title: "Test", requirements: "", video: "", steps: [{ id: "step", text: "Instruction", image: "", caption: "" }] }] };

test("Google admin sessions reject expiration, tampering, old password cookies, other accounts and secret rotation", async () => {
  const env = authEnv();
  const api = await serverModule(env, os.tmpdir());
  const token = api.sessionToken(env.GOOGLE_ADMIN_SUB);
  assert.equal(api.isAdmin(request(token)), true);
  for (const invalid of ["", token + ".extra", token.replace(/.$/, "z"), "123.abc"]) assert.equal(api.isAdmin(request(invalid)), false);
  const signedSession = (sub, exp) => {
    const raw = Buffer.from(JSON.stringify({ v: 2, sub, exp, client: env.GOOGLE_CLIENT_ID })).toString("base64url");
    return `${raw}.${createHmac("sha256", env.ADMIN_SESSION_SECRET).update(`google-admin-v2:${raw}`).digest("hex")}`;
  };
  assert.equal(api.isAdmin(request(signedSession(env.GOOGLE_ADMIN_SUB, Date.now() - 1))), false);
  assert.equal(api.isAdmin(request(signedSession("999", Date.now() + 10000))), false);
  assert.throws(() => api.sessionToken("999"), /관리자/);
  env.GOOGLE_ADMIN_SUB = "987654321";
  assert.equal(api.isAdmin(request(token)), false);
  env.GOOGLE_ADMIN_SUB = "123456789";
  env.ADMIN_SESSION_SECRET = "rotated-test-secret-at-least-32-characters";
  assert.equal(api.isAdmin(request(token)), false);
  assert.equal(api.sameOrigin(request("")), true);
  for (const origin of ["https://localhost:3000", "http://evil.test", "null"]) assert.equal(api.sameOrigin(request("", origin)), false);
});

test("OAuth state, nonce, PKCE and return paths are bound to a signed expiring flow", async () => {
  const env = authEnv();
  const auth = await serverModule(env, os.tmpdir(), {}, "admin-auth");
  const first = auth.beginGoogleLogin("/tracks/mario-circuit/shortcuts");
  const url = new URL(first.url);
  assert.equal(url.origin, "https://accounts.google.com");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("prompt"), "select_account");
  assert.equal(url.searchParams.get("scope"), "openid email");
  const flow = auth.readGoogleFlow(first.flow, url.searchParams.get("state"));
  assert.equal(flow.returnTo, "/tracks/mario-circuit/shortcuts");
  assert.equal(flow.nonce, url.searchParams.get("nonce"));
  assert.throws(() => auth.readGoogleFlow(first.flow, "wrong"));
  assert.throws(() => auth.readGoogleFlow(first.flow + "x", url.searchParams.get("state")));
  const flowData = JSON.parse(Buffer.from(first.flow.split(".")[0], "base64url").toString());
  flowData.exp = Date.now() - 1;
  const expiredRaw = Buffer.from(JSON.stringify(flowData)).toString("base64url");
  const expiredFlow = `${expiredRaw}.${createHmac("sha256", env.ADMIN_SESSION_SECRET).update(`google-flow-v1:${expiredRaw}`).digest("hex")}`;
  assert.throws(() => auth.readGoogleFlow(expiredFlow, url.searchParams.get("state")));
  assert.equal(auth.isAdmin(request(first.flow)), false, "OAuth setup cookies must not grant administrator access");
  assert.equal(auth.safeReturnTo("//evil.test"), "/admin/content");
  assert.equal(auth.safeReturnTo("/tracks/../admin/shortcuts"), "/admin/content");
  env.GOOGLE_REDIRECT_URI = "https://changed.example.test/api/shortcut-admin/callback";
  assert.throws(() => auth.readGoogleFlow(first.flow, url.searchParams.get("state")));
  env.GOOGLE_REDIRECT_URI = "http://example.test/api/shortcut-admin/callback";
  assert.equal(auth.googleConfigured(), false);
});

test("first Google account lookup returns its verified ID but never grants an admin session", async () => {
  const env = { ...authEnv(), GOOGLE_ADMIN_SUB: "", GOOGLE_ADMIN_EMAIL_HINT: "admin@example.test" };
  const auth = await serverModule(env, os.tmpdir(), {}, "admin-auth");
  assert.equal(auth.googleConfigured(), true);
  assert.equal(auth.adminConfigured(), false);
  assert.throws(() => auth.sessionToken("123456789"));
  const login = auth.beginGoogleLogin("/admin/content");
  assert.equal(new URL(login.url).searchParams.get("prompt"), "consent");
  assert.equal(new URL(login.url).searchParams.get("login_hint"), "admin@example.test");
  const url = new URL(login.url);
  let exchanges = 0;
  const authWithTransport = { ...auth, exchangeGoogleCode: async () => { exchanges++; return "123456789"; } };
  const source = await readFile(new URL("../app/api/shortcut-admin/callback/route.ts", import.meta.url), "utf8");
  const compiled = { exports: {} };
  const server = await serverModule(env, os.tmpdir());
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module: compiled, exports: compiled.exports, require: (id) => id === "@/lib/admin-auth" ? authWithTransport : id === "@/lib/shortcut-server" ? server : require(id), process: { env }, URL });
  const { NextRequest } = require("next/server");
  const callback = new URL(env.GOOGLE_REDIRECT_URI);
  callback.search = new URLSearchParams({ code: "verified-test-code", state: url.searchParams.get("state") }).toString();
  const response = await compiled.exports.GET(new NextRequest(callback, { headers: { Host: "localhost:3000", Cookie: `mkw-google-flow=${login.flow}` } }));
  assert.equal(response.status, 403);
  assert.match(await response.text(), /GOOGLE_ADMIN_SUB=123456789/);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.ok(response.headers.getSetCookie().filter((value) => value.startsWith("mkw-admin=")).every((value) => value.includes("Max-Age=0")));
  assert.equal(exchanges, 1);
  callback.searchParams.set("state", "wrong");
  const failed = await compiled.exports.GET(new NextRequest(callback, { headers: { Host: "localhost:3000", Cookie: `mkw-google-flow=${login.flow}` } }));
  assert.match(failed.headers.get("location"), /authError=failed/);
  assert.equal(exchanges, 1, "state must be verified before sending any code to Google");
});

test("Google ID token verification checks real RSA signatures, issuer, audience, expiration, nonce and verified email", async () => {
  const env = authEnv();
  const auth = await serverModule(env, os.tmpdir(), {}, "admin-auth");
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const jwk = { ...await exportJWK(publicKey), kid: "test-key", alg: "RS256" };
  const keys = createLocalJWKSet({ keys: [jwk] });
  const payload = { sub: env.GOOGLE_ADMIN_SUB, iss: "https://accounts.google.com", aud: env.GOOGLE_CLIENT_ID, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 300, nonce: "test-nonce", email: "admin@example.test", email_verified: true };
  const sign = (patch) => new SignJWT({ ...payload, ...patch }).setProtectedHeader({ alg: "RS256", kid: "test-key" }).sign(privateKey);
  assert.equal(await auth.verifyGoogleIdToken(await sign({}), "test-nonce", keys), env.GOOGLE_ADMIN_SUB);
  assert.equal(await auth.verifyGoogleIdToken(await sign({ sub: "opaque-account-id" }), "test-nonce", keys), "opaque-account-id");
  for (const patch of [{ iss: "https://evil.test" }, { aud: "other-client" }, { exp: 1 }, { nonce: "wrong" }, { email_verified: false }, { azp: "other-client" }, { sub: "" }, { iat: 1 }]) await assert.rejects(auth.verifyGoogleIdToken(await sign(patch), "test-nonce", keys));
  const badKey = await generateKeyPair("RS256");
  const forged = await new SignJWT(payload).setProtectedHeader({ alg: "RS256", kid: "test-key" }).sign(badKey.privateKey);
  await assert.rejects(auth.verifyGoogleIdToken(forged, "test-nonce", keys));
});

test("request byte limits and malformed JSON fail explicitly", async () => {
  const api = await serverModule({}, os.tmpdir());
  assert.deepEqual(JSON.parse(JSON.stringify(await api.readJsonBody(new Request("http://local", { method: "POST", body: '{"ok":true}' }), 11))), { ok: true });
  await assert.rejects(api.readJsonBody(new Request("http://local", { method: "POST", body: "x".repeat(12) }), 11), /용량/);
  await assert.rejects(api.readJsonBody(new Request("http://local", { method: "POST", body: "{" }), 11));
});

test("local concurrent saves have one winner and preserve readable data", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "mkw-server-test-"));
  try {
    const api = await serverModule({ SHORTCUT_STORAGE: "local" }, root);
    const results = await Promise.allSettled([api.saveShortcuts("test-track", content, "empty"), api.saveShortcuts("test-track", content, "empty")]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.ok(results.find((r) => r.status === "rejected").reason instanceof api.ShortcutConflictError);
    const saved = await api.loadShortcuts("test-track");
    assert.equal(saved.data.shortcuts[0].title, "Test");
    await assert.rejects(api.saveShortcuts("test-track", content, "empty"), api.ShortcutConflictError);
    const empty = await api.saveShortcuts("test-track", { ...content, shortcuts: [], researchStatus: "no-shortcuts" }, saved.revision);
    assert.equal((await api.loadShortcuts("test-track")).revision, empty.revision);
    assert.equal(empty.data.researchStatus, "no-shortcuts");
  } finally {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith("mkw-server-test-"));
    await rm(root, { recursive: true, force: true });
  }
});

test("Blob saves round-trip ETags and conditional races become conflicts (mock transport)", async () => {
  class PreconditionError extends Error {}
  let stored = null;
  let count = 0;
  const options = [];
  const api = await serverModule({ BLOB_READ_WRITE_TOKEN: "test-token", SHORTCUT_STORAGE: "local", VERCEL: "1" }, os.tmpdir(), {
    BlobPreconditionFailedError: PreconditionError,
    get: async () => stored && ({ statusCode: 200, stream: new Blob([stored.raw]).stream(), blob: { etag: stored.etag } }),
    put: async (pathname, raw, config) => {
      options.push({ pathname, ...config });
      if (stored && (!config.allowOverwrite || config.ifMatch !== stored.etag)) throw new PreconditionError();
      stored = { raw, etag: `etag-${++count}` };
      return { etag: stored.etag };
    },
  });
  assert.equal(api.localStorageEnabled(), false, "Vercel must never use ephemeral local files");
  const races = await Promise.allSettled([api.saveShortcuts(content.track, content, "empty"), api.saveShortcuts(content.track, content, "empty")]);
  assert.equal(races.filter((r) => r.status === "fulfilled").length, 1);
  assert.ok(races.find((r) => r.status === "rejected").reason instanceof api.ShortcutConflictError);
  const first = await api.loadShortcuts(content.track);
  assert.equal(first.revision, "etag-1");
  assert.equal(first.data.shortcuts[0].title, "Test");
  await api.saveShortcuts(content.track, { ...content, shortcuts: [] }, first.revision);
  assert.equal((await api.loadShortcuts(content.track)).data.shortcuts.length, 0);
  assert.equal(options.at(-1).ifMatch, first.revision);
  assert.equal(options.at(-1).addRandomSuffix, false);
  await assert.rejects(api.saveShortcuts(content.track, content, first.revision), api.ShortcutConflictError);
});
