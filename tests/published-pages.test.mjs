import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { createHmac } from "node:crypto";
import { readdir } from "node:fs/promises";
import { restoreBackup } from "../scripts/shortcut-maintenance.mjs";
import { generateKeyPair, SignJWT, exportJWK } from "jose";
import test from "node:test";

const require = createRequire(import.meta.url);
const project = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

test("published saves, permissions, media and backup recovery agree across production pages", { timeout: 120000 }, async () => {
  // The production app runs with a temporary cwd, isolating all local content from user files.
  const sandbox = await mkdtemp(path.join(os.tmpdir(), "mkw-published-test-"));
  const listener = net.createServer();
  listener.listen(0, "127.0.0.1");
  await once(listener, "listening");
  const port = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  const secret = "test-only-google-session-secret-32-characters";
  const clientId = "integration.apps.googleusercontent.com";
  const adminSub = "123456789012345678901";
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const jwks = { keys: [{ ...await exportJWK(publicKey), kid: "integration-key", alg: "RS256" }] };
  const server = spawn(process.execPath, ["--import", pathToFileURL(path.join(project, "tests/google-oauth-mock.mjs")).href, require.resolve("next/dist/bin/next"), "start", project, "-H", "127.0.0.1", "-p", String(port)], {
    cwd: sandbox,
    env: { ...process.env, SHORTCUT_STORAGE: "local", SHORTCUT_ADMIN_PASSWORD: "", GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: "test-only-google-client-secret", GOOGLE_REDIRECT_URI: `${base}/api/shortcut-admin/callback`, GOOGLE_ADMIN_SUB: adminSub, ADMIN_SESSION_SECRET: secret, TEST_GOOGLE_JWKS: JSON.stringify(jwks), VERCEL: "", VERCEL_ENV: "production", SITE_URL: "https://wiki.example.test", BLOB_READ_WRITE_TOKEN: "", NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  let output = "";
  server.stdout.on("data", (data) => { output += data; });
  server.stderr.on("data", (data) => { output += data; });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Server did not start: ${output}`)), 15000);
      const inspect = () => { if (output.includes("Ready in")) { clearTimeout(timer); resolve(); } };
      server.stdout.on("data", inspect);
      server.once("exit", () => { clearTimeout(timer); reject(new Error(output)); });
      inspect();
    });
    const html = async (route) => {
      const response = await fetch(`${base}${route}`);
      assert.equal(response.status, 200, `${route}: ${output}`);
      // Assert visible rendered HTML, excluding serialized RSC props and scripts.
      return (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
    };
    let endpoint = `${base}/api/tracks/whistlestop-summit/shortcuts`;
    const sharedResponse = await fetch(`${base}/tracks/whistlestop-summit/shortcuts`, { headers: { "User-Agent": "facebookexternalhit/1.1" } });
    const sharedHtml = await sharedResponse.text();
    const head = /<head>([\s\S]*?)<\/head>/.exec(sharedHtml)[1];
    assert.match(sharedHtml, /<html[^>]*lang="ko"/);
    assert.match(head, /<link rel="canonical" href="https:\/\/wiki.example.test\/tracks\/whistlestop-summit\/shortcuts"/);
    assert.match(head, /property="og:title" content="Whistlestop Summit · 숏컷 가이드/);
    assert.match(head, /property="og:description"/);
    assert.match(head, /property="og:image" content="https:\/\/wiki.example.test\/images\/tracks\/whistlestop-summit.webp"/);
    assert.match(head, /name="twitter:card" content="summary_large_image"/);
    const filteredHtml = await html("/tracks?q=test&cup=Mushroom+Cup");
    assert.match(filteredHtml, /rel="canonical" href="https:\/\/wiki.example.test\/tracks"/);
    const robots = await (await fetch(`${base}/robots.txt`)).text();
    assert.match(robots, /Disallow: \/admin\//);
    assert.match(robots, /Disallow: \/api\//);
    assert.match(robots, /Sitemap: https:\/\/wiki.example.test\/sitemap.xml/);
    const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
    const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
    assert.equal(new Set(urls).size, urls.length);
    assert.equal(urls.filter((url) => /\/tracks\/[^/]+\/shortcuts$/.test(url)).length, 40);
    assert.ok(urls.includes("https://wiki.example.test/mechanics/drifting"));
    assert.ok(urls.includes("https://wiki.example.test/strategies/basic/racing-line"));
    assert.ok(urls.every((url) => !/\/admin\/|\/api\/|\?/.test(url)));
    assert.doesNotMatch(sitemap, /<lastmod>/);
    const shareImage = await fetch(`${base}/share-image`);
    assert.equal(shareImage.status, 200);
    assert.match(shareImage.headers.get("content-type"), /image\/png/);
    const imageInfo = await require("sharp")(Buffer.from(await shareImage.arrayBuffer())).metadata();
    assert.equal(imageInfo.width, 1200);
    assert.equal(imageInfo.height, 630);
    assert.match(await html("/tracks/mario-bros-circuit/shortcuts"), /아직 등록된 숏컷이 없습니다/);
    assert.match(await html("/admin/content"), /관리자 콘텐츠 현황/);
    assert.equal((await fetch(`${base}/api/admin/content`)).status, 401);
    assert.equal((await fetch(`${base}/api/admin/content?backup=1`)).status, 401);
    assert.match(await html("/mechanics"), /href="\/mechanics\/drifting"/);
    assert.match(await html("/mechanics/off-road-movement"), /Off-road Movement/);
    assert.match(await html("/strategies"), /href="\/strategies\/basic"/);
    assert.match(await html("/strategies"), /href="\/strategies\/tracks"/);
    assert.match(await html("/strategies/basic"), /href="\/strategies\/basic\/racing-line"/);
    assert.match(await html("/strategies/basic/racing-line"), /Racing Line/);
    for (const route of ["/strategies/tracks", "/shortcuts"]) {
      assert.match(await html(route), /Showing <!-- -->40<!-- --> of <!-- -->40/, route);
    }
    assert.match(await html("/strategies/tracks"), /href="\/tracks\/mario-bros-circuit\/strategies"/);
    assert.match(await html("/shortcuts"), /href="\/tracks\/mario-bros-circuit\/shortcuts"/);
    assert.match(await html("/shortcuts?guide=pending"), /Showing <!-- -->36<!-- --> of <!-- -->40/);
    assert.match(await html("/tracks/mario-bros-circuit/strategies"), /아직/);
    assert.match(await html("/tracks/mario-circuit/strategies"), /Mario Circuit/);
    for (const route of ["/mechanics/unknown", "/strategies/basic/unknown", "/tracks/unknown/strategies"]) {
      assert.equal((await fetch(`${base}${route}`)).status, 404, route);
    }
    assert.match(await html("/tracks?course=snes&difficulty=unrated"), /Showing <!-- -->10<!-- --> of <!-- -->40/);
    assert.match(await html("/tracks?cup=Mushroom+Cup&course=main"), /Showing <!-- -->4<!-- --> of <!-- -->40/);
    assert.match(await html("/tracks?view=shortcuts&guide=pending"), /Showing <!-- -->36<!-- --> of <!-- -->40/);
    assert.match(await html("/tracks?q=Mountain+Cut"), /Summit Mountain Cut/);
    const ordered = await html("/tracks?sort=name-asc");
    assert.ok(ordered.indexOf("<h2>Acorn Heights</h2>") < ordered.indexOf("<h2>Mario Circuit</h2>"));
    let state = await (await fetch(endpoint)).json();
    assert.equal(state.data, null, "test server must not read the user's content");
    assert.match(await html("/tracks/whistlestop-summit"), /Summit Mountain Cut/);
    const payload = { version: 1, track: "whistlestop-summit", shortcuts: [{
      id: "integration-id", title: "Integration shortcut", summary: "Unique searchable summary", difficulty: 3,
      requirements: "Test condition", video: "", steps: [{ id: "integration-step", text: "Test instruction", image: "", caption: "" }],
    }] };
    const put = async (data, headers = {}) => fetch(endpoint, {
      method: "PUT", headers: { Origin: base, "Content-Type": "application/json", "If-Match": state.revision, ...headers }, body: JSON.stringify(data),
    });
    assert.equal((await put(payload)).status, 401);
    const uploadEndpoint = `${base}/api/shortcut-upload?slug=whistlestop-summit`;
    assert.equal((await fetch(uploadEndpoint, { method: "PUT", headers: { Origin: base, "Content-Type": "image/png" }, body: "unauthorized" })).status, 401);
    const blobUnauthorized = await fetch(`${base}/api/shortcut-upload`, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ type: "blob.generate-client-token", payload: { pathname: "shortcuts/media/whistlestop-summit/abc.png", callbackUrl: `${base}/api/shortcut-upload`, clientPayload: null } }) });
    assert.equal(blobUnauthorized.status, 400);
    assert.match((await blobUnauthorized.json()).error, /권한/);
    const wrongLogin = await fetch(`${base}/api/shortcut-admin`, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ password: "wrong" }) });
    assert.equal(wrongLogin.status, 400, "password login must be removed");
    assert.match((await wrongLogin.json()).error, /비밀번호 로그인은 지원하지/);
    assert.equal((await fetch(`${base}/api/shortcut-admin`, { method: "POST", headers: { Origin: "https://evil.test", "Content-Type": "application/json" }, body: "{}" })).status, 403);
    const googleLogin = async (claims = {}, stateOverride) => {
      const start = await fetch(`${base}/api/shortcut-admin`, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ returnTo: "/tracks/mario-bros-circuit/shortcuts" }) });
      assert.equal(start.status, 200);
      assert.match(start.headers.get("set-cookie"), /SameSite=lax/i);
      const flowCookie = start.headers.get("set-cookie").split(";")[0];
      assert.ok(flowCookie.startsWith("mkw-google-flow="));
      const authorization = new URL((await start.json()).url);
      assert.equal(authorization.origin, "https://accounts.google.com");
      assert.equal(authorization.searchParams.get("code_challenge_method"), "S256");
      const code = await new SignJWT({ sub: adminSub, email: "admin@example.test", email_verified: true, nonce: authorization.searchParams.get("nonce"), ...claims }).setProtectedHeader({ alg: "RS256", kid: "integration-key" }).setIssuer("https://accounts.google.com").setAudience(clientId).setIssuedAt().setExpirationTime("5m").sign(privateKey);
      const callback = new URL(`${base}/api/shortcut-admin/callback`);
      callback.search = new URLSearchParams({ code, state: stateOverride ?? authorization.searchParams.get("state") }).toString();
      return fetch(callback, { headers: { Cookie: flowCookie }, redirect: "manual" });
    };
    const forbidden = await googleLogin({ sub: "999999" });
    assert.match(forbidden.headers.get("location"), /authError=forbidden/);
    assert.ok(forbidden.headers.getSetCookie().filter((value) => value.startsWith("mkw-admin=")).every((value) => value.includes("Max-Age=0")));
    const wrongState = await googleLogin({}, "wrong-state");
    assert.match(wrongState.headers.get("location"), /authError=failed/);
    const wrongNonce = await googleLogin({ nonce: "wrong-nonce" });
    assert.match(wrongNonce.headers.get("location"), /authError=failed/);
    const noFlow = await fetch(`${base}/api/shortcut-admin/callback?code=fake&state=fake`, { redirect: "manual" });
    assert.match(noFlow.headers.get("location"), /authError=failed/);
    const login = await googleLogin();
    assert.equal(login.status, 307);
    assert.equal(login.headers.get("location"), `${base}/tracks/mario-bros-circuit/shortcuts`);
    const sessionHeader = login.headers.getSetCookie().find((value) => value.startsWith("mkw-admin="));
    const cookie = sessionHeader.split(";")[0];
    assert.match(login.headers.get("set-cookie"), /HttpOnly/i);
    assert.match(sessionHeader, /SameSite=strict/i);
    assert.equal((await (await fetch(`${base}/api/shortcut-admin`, { headers: { Cookie: cookie } })).json()).authenticated, true);
    for (const [kind, slug, route, content, text] of [
      ["mechanics", "drifting", "/mechanics/drifting", { description: "Saved drifting summary", sections: [{ title: "Corner entry", text: "Saved drifting explanation" }] }, "Saved drifting explanation"],
      ["basic", "racing-line", "/strategies/basic/racing-line", { description: "Saved strategy summary", sections: [{ title: "Line choice", text: "Saved basic strategy" }] }, "Saved basic strategy"],
      ["tracks", "mario-bros-circuit", "/tracks/mario-bros-circuit/strategies", { strategies: ["Saved track strategy"] }, "Saved track strategy"],
    ]) {
      const url = `${base}/api/guides/${kind}/${slug}`;
      const before = await (await fetch(url)).json();
      assert.equal(before.revision, "empty");
      const saveGuide = (body, revision = before.revision, session = cookie, origin = base) => fetch(url, { method: "PUT", headers: { Origin: origin, ...(session ? { Cookie: session } : {}), "Content-Type": "application/json", "If-Match": revision }, body: JSON.stringify(body) });
      assert.equal((await saveGuide(content, before.revision, "")).status, 401);
      assert.equal((await saveGuide(content, before.revision, cookie, "https://evil.test")).status, 401);
      const savedResponse = await saveGuide(content);
      assert.equal(savedResponse.status, 200, await savedResponse.clone().text());
      const saved = await savedResponse.json();
      assert.deepEqual((await (await fetch(url)).json()).content, content);
      assert.equal((await saveGuide(content)).status, 409);
      assert.match(await html(route), new RegExp(text));
      if (kind === "tracks") assert.match(await html("/tracks/mario-bros-circuit"), /Saved track strategy/);
      else assert.match(await html(kind === "mechanics" ? "/mechanics" : "/strategies/basic"), new RegExp(content.description));
      assert.ok(saved.revision && saved.revision !== "empty");
    }
    const rawExpired = Buffer.from(JSON.stringify({ v: 2, sub: adminSub, exp: Date.now() - 1000, client: clientId })).toString("base64url");
    const expiredCookie = `mkw-admin=${rawExpired}.${createHmac("sha256", secret).update(`google-admin-v2:${rawExpired}`).digest("hex")}`;
    assert.equal((await (await fetch(`${base}/api/shortcut-admin`, { headers: { Cookie: expiredCookie } })).json()).authenticated, false);
    assert.equal((await put(payload, { Cookie: expiredCookie })).status, 401);
    assert.equal((await put(payload, { Cookie: cookie, Origin: "https://evil.test" })).status, 401);
    assert.equal((await put(payload, { Cookie: cookie, Origin: base.replace("http:", "https:") })).status, 401);
    const upload = (body, mime, session = cookie) => fetch(uploadEndpoint, { method: "PUT", headers: { Origin: base, Cookie: session, "Content-Type": mime }, body });
    assert.equal((await upload("expired", "image/png", expiredCookie)).status, 401);
    assert.equal((await upload("bad", "text/html")).status, 400);
    assert.equal((await upload(Buffer.alloc(0), "image/png")).status, 400);
    assert.equal((await upload(Buffer.alloc(10 * 1024 * 1024 + 1), "image/png")).status, 400);
    assert.equal((await upload(Buffer.alloc(100 * 1024 * 1024 + 1), "video/mp4")).status, 400);
    assert.deepEqual(await readdir(path.join(sandbox, ".shortcut-data", "media")), [], "failed uploads must not leave partial files");
    const image = await require("sharp")({ create: { width: 2, height: 2, channels: 3, background: "red" } }).png().toBuffer();
    const imageResponse = await upload(image, "image/png");
    assert.equal(imageResponse.status, 200);
    const imageUrl = (await imageResponse.json()).url;
    assert.deepEqual(Buffer.from(await (await fetch(`${base}${imageUrl}`)).arrayBuffer()), image);
    // Range transport checks use a binary fixture; browser codec playback is a separate check.
    const video = Buffer.from("0123456789-video-range-fixture");
    const videoResponse = await upload(video, "video/mp4");
    assert.equal(videoResponse.status, 200);
    const videoUrl = (await videoResponse.json()).url;
    for (const [range, start, end] of [["bytes=0-3", 0, 3], ["bytes=5-", 5, video.length - 1], ["bytes=-4", video.length - 4, video.length - 1]]) {
      const response = await fetch(`${base}${videoUrl}`, { headers: { Range: range } });
      assert.equal(response.status, 206);
      assert.equal(response.headers.get("content-range"), `bytes ${start}-${end}/${video.length}`);
      assert.equal(response.headers.get("content-type"), "video/mp4");
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), video.subarray(start, end + 1));
    }
    for (const range of ["bytes=999-", "bytes=4-2", "bytes=-0", "bytes=0-1,4-5", "bytes=-"]) assert.equal((await fetch(`${base}${videoUrl}`, { headers: { Range: range } })).status, 416);
    assert.equal((await fetch(`${base}/api/shortcut-media/abc.mp4`)).status, 404);
    const dashboard = async () => (await fetch(`${base}/api/admin/content`, { headers: { Cookie: cookie } })).json();
    const initialDashboard = await dashboard();
    assert.equal(initialDashboard.tracks.length, 40);
    assert.equal(initialDashboard.tracks.filter((row) => row.status === "legacy").length, 4);
    assert.equal(initialDashboard.tracks.filter((row) => row.status === "unreviewed").length, 36);
    const save = async (data) => {
      const response = await put(data, { Cookie: cookie });
      assert.equal(response.status, 200, await response.clone().text());
      state = await response.json();
    };
    await save(payload);
    const stored = JSON.parse(await readFile(path.join(sandbox, ".shortcut-data", "whistlestop-summit.json"), "utf8"));
    assert.equal(stored.shortcuts[0].summary, payload.shortcuts[0].summary);
    assert.equal(stored.shortcuts[0].difficulty, 3);
    assert.ok(Number.isFinite(Date.parse(stored.updatedAt)));
    const savedRow = (await dashboard()).tracks.find((row) => row.slug === "whistlestop-summit");
    assert.equal(savedRow.count, 1);
    assert.equal(savedRow.status, "written");
    assert.equal(savedRow.updatedAt, stored.updatedAt);
    assert.deepEqual(savedRow.incomplete, ["영상 보완", "단계 이미지 보완"]);
    // Public text must be in semantic HTML, not just serialized client props or metadata.
    const shortcutHtml = await html("/tracks/whistlestop-summit/shortcuts");
    assert.match(shortcutHtml, /<p class="shortcut-prose">Test instruction<\/p>/);
    assert.match(shortcutHtml, /<p class="shortcut-prose">Test condition<\/p>/);
    assert.match(shortcutHtml.replace(/<!--[\s\S]*?-->/g, ""), /<h2>숏컷 1 · Integration shortcut<\/h2>/);
    for (const route of ["/", "/tracks?view=shortcuts&q=Unique", "/tracks/whistlestop-summit", "/tracks/whistlestop-summit/shortcuts"]) {
      const rendered = await html(route);
      assert.match(rendered, /Integration shortcut/, route);
      assert.doesNotMatch(rendered, /Summit Mountain Cut/, route);
    }
    assert.match(await html("/"), /shortcuts#shortcut-integration-id/);
    assert.match(await html("/tracks/whistlestop-summit/shortcuts"), /id="shortcut-integration-id"/);
    assert.doesNotMatch(await html("/tracks?view=shortcuts&q=DoesNotExist"), /Integration shortcut/);
    const staleRevision = "empty";
    assert.equal((await put(payload, { Cookie: cookie, "If-Match": staleRevision })).status, 409);
    const invalid = { ...payload, shortcuts: [{ ...payload.shortcuts[0], title: " ", video: "http://example.com/video.mp4", steps: [{ ...payload.shortcuts[0].steps[0], text: " " }] }] };
    const invalidResponse = await put(invalid, { Cookie: cookie });
    assert.equal(invalidResponse.status, 400);
    assert.match((await invalidResponse.json()).error, /숏컷 1.*이름/);
    assert.equal((await (await fetch(endpoint)).json()).revision, state.revision);
    payload.shortcuts[0].title = "Edited shortcut";
    await save(payload);
    assert.match(await html("/"), /Edited shortcut/);
    assert.doesNotMatch(await html("/tracks/whistlestop-summit"), /Integration shortcut/);
    // Old backups must remain readable and unrated after saving.
    delete payload.shortcuts[0].summary;
    delete payload.shortcuts[0].difficulty;
    await save(payload);
    assert.match(await html("/tracks?view=shortcuts&q=Test"), /Not rated/);
    await save({ ...payload, shortcuts: [] });
    for (const route of ["/", "/tracks?view=shortcuts", "/tracks/whistlestop-summit", "/tracks/whistlestop-summit/shortcuts"]) {
      const rendered = await html(route);
      assert.doesNotMatch(rendered, /Edited shortcut|Integration shortcut|Summit Mountain Cut/, route);
    }
    // A course with no original shortcut must enter the catalog when first published.
    endpoint = `${base}/api/tracks/mario-bros-circuit/shortcuts`;
    state = await (await fetch(endpoint)).json();
    assert.equal(state.data, null);
    const fresh = { ...payload, track: "mario-bros-circuit", shortcuts: [{ ...payload.shortcuts[0], title: "New course shortcut" }] };
    await save(fresh);
    for (const route of ["/", "/tracks?view=shortcuts&q=New", "/tracks/mario-bros-circuit", "/tracks/mario-bros-circuit/shortcuts"]) {
      assert.match(await html(route), /New course shortcut/, route);
    }
    assert.match(await html("/"), /<strong>4<\/strong><span>Shortcuts<\/span>/);
    assert.doesNotMatch(await html("/tracks?view=shortcuts&q=New&difficulty=easy"), /New course shortcut/);
    await save({ ...fresh, shortcuts: [] });
    assert.equal((await dashboard()).tracks.find((row) => row.slug === fresh.track).status, "unreviewed");
    await save({ ...fresh, shortcuts: [], researchStatus: "no-shortcuts" });
    assert.equal((await dashboard()).tracks.find((row) => row.slug === fresh.track).status, "no-shortcuts");
    // Existing editor saves omit optional metadata; confirmed absence should survive.
    await save({ ...fresh, shortcuts: [] });
    assert.equal(state.data.researchStatus, "no-shortcuts");
    const exportedResponse = await fetch(`${base}/api/admin/content?backup=1`, { headers: { Cookie: cookie } });
    assert.equal(exportedResponse.status, 200);
    assert.match(exportedResponse.headers.get("content-disposition"), /attachment/);
    const exported = await exportedResponse.json();
    assert.equal(exported.tracks.length, 40);
    assert.equal(exported.tracks.find((row) => row.slug === fresh.track).content.researchStatus, "no-shortcuts");
    assert.equal(exported.tracks.find((row) => row.slug === "mario-circuit").saved, false);
    // Restore exported JSON through the same authenticated save API, then read it back.
    await save({ ...fresh, shortcuts: [], researchStatus: "unreviewed" });
    await restoreBackup(exported, base);
    assert.equal((await (await fetch(endpoint)).json()).data.researchStatus, "unreviewed", "dry-run must not write");
    const recoveryFile = path.join(sandbox, "pre-restore.json");
    await restoreBackup(exported, base, { apply: true, cookie, recoveryFile });
    state = await (await fetch(endpoint)).json();
    assert.equal(state.data.researchStatus, "no-shortcuts");
    assert.equal(JSON.parse(await readFile(recoveryFile, "utf8")).tracks.find((row) => row.slug === fresh.track).content.researchStatus, "unreviewed");
    assert.equal((await (await fetch(`${base}/api/tracks/mario-circuit/shortcuts`)).json()).data, null, "legacy rows must not become persisted");
    payload.shortcuts[0].video = videoUrl;
    payload.shortcuts[0].steps[0].image = imageUrl;
    await save({ ...payload, track: fresh.track });
    const mediaHtml = await html(`/tracks/${fresh.track}/shortcuts`);
    assert.match(mediaHtml, /<video[^>]*controls/);
    assert.ok(mediaHtml.includes(videoUrl));
    assert.ok(mediaHtml.includes(imageUrl));
    const mediaBackup = await (await fetch(`${base}/api/admin/content?backup=1`, { headers: { Cookie: cookie } })).json();
    await save({ ...fresh, shortcuts: [], researchStatus: "no-shortcuts" });
    await restoreBackup(mediaBackup, base, { apply: true, cookie, recoveryFile: path.join(sandbox, "pre-media-restore.json") });
    state = await (await fetch(endpoint)).json();
    assert.equal(state.data.shortcuts[0].video, videoUrl);
    assert.equal(state.data.shortcuts[0].steps[0].image, imageUrl);
    assert.deepEqual(Buffer.from(await (await fetch(`${base}${imageUrl}`)).arrayBuffer()), image);
    await save({ ...fresh, shortcuts: [], researchStatus: "no-shortcuts" });
    const contentFile = path.join(sandbox, ".shortcut-data", `${fresh.track}.json`);
    const original = await readFile(contentFile, "utf8");
    await writeFile(contentFile, "invalid-json");
    assert.equal((await dashboard()).tracks.find((row) => row.slug === fresh.track).status, "error");
    assert.equal((await fetch(`${base}/api/admin/content?backup=1`, { headers: { Cookie: cookie } })).status, 500);
    await writeFile(contentFile, original);
    assert.match(await html("/"), /<strong>3<\/strong><span>Shortcuts<\/span>/);
    assert.equal((await fetch(`${base}/tracks/unknown-track`)).status, 404);
    assert.match(await html("/tracks?view=mechanics&q=Drifting"), /Mario Circuit/);
    const logout = await fetch(`${base}/api/shortcut-admin`, { method: "DELETE", headers: { Origin: base, Cookie: cookie } });
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get("set-cookie"), /Max-Age=0/i);
    const clearedCookie = logout.headers.get("set-cookie").split(";")[0];
    assert.equal((await (await fetch(`${base}/api/shortcut-admin`, { headers: { Cookie: clearedCookie } })).json()).authenticated, false);
    assert.equal((await put(payload, { Cookie: clearedCookie })).status, 401);
  } finally {
    const exited = once(server, "exit");
    if (server.exitCode === null) { server.kill(); await exited; }
    const resolved = path.resolve(sandbox);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith("mkw-published-test-"));
    await rm(resolved, { recursive: true, force: true });
  }
});
