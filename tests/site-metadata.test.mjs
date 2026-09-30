import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../lib/site-metadata.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { resolveSiteUrl, publicIndexingEnabled, pageMetadata, trackMetadata } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

test("canonical origin uses explicit domain then stable Vercel production domain", () => {
  assert.equal(resolveSiteUrl({ SITE_URL: "https://wiki.example.test", VERCEL_PROJECT_PRODUCTION_URL: "fallback.vercel.app" }).href, "https://wiki.example.test/");
  assert.equal(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "fallback.vercel.app" }).href, "https://fallback.vercel.app/");
  assert.equal(resolveSiteUrl({ VERCEL_URL: "temporary.vercel.app" }), undefined);
  for (const SITE_URL of ["not-a-url", "ftp://wiki.test", "https://wiki.test/path", "https://user:secret@wiki.test", "https://wiki.test?q=x", "https://wiki.test/#fragment"]) {
    assert.throws(() => resolveSiteUrl({ SITE_URL }));
  }
});

test("local, unconfigured and preview environments are excluded from indexing", () => {
  const production = { SITE_URL: "https://wiki.example.test", NODE_ENV: "production" };
  assert.equal(publicIndexingEnabled(production), true);
  assert.equal(publicIndexingEnabled({ ...production, VERCEL_ENV: "production" }), true);
  assert.equal(publicIndexingEnabled({ ...production, VERCEL_ENV: "preview" }), false);
  assert.equal(publicIndexingEnabled({ ...production, NODE_ENV: "development" }), false);
  assert.equal(publicIndexingEnabled({ NODE_ENV: "production" }), false);
  for (const host of ["localhost", "127.0.0.1", "[::1]"]) assert.equal(publicIndexingEnabled({ SITE_URL: `http://${host}:3000`, NODE_ENV: "production" }), false);
});

test("track share cards agree with page title, description, image and canonical path", () => {
  const previous = { ...process.env };
  try {
    process.env.SITE_URL = "https://wiki.example.test";
    process.env.NODE_ENV = "production";
    delete process.env.VERCEL_ENV;
    const track = { slug: "mario-circuit", name: "Mario Circuit", nameKo: "등록된 한글명", summary: "Existing summary", image: { src: "/images/tracks/mario-circuit.webp", alt: "Course preview", width: 600, height: 400 } };
    for (const section of ["overview", "shortcuts", "strategies"]) {
      const metadata = trackMetadata(track, section);
      const pathname = `/tracks/mario-circuit${section === "overview" ? "" : `/${section}`}`;
      assert.equal(metadata.alternates.canonical, `https://wiki.example.test${pathname}`);
      assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
      assert.equal(metadata.openGraph.title, metadata.title);
      assert.equal(metadata.twitter.description, metadata.description);
      assert.equal(metadata.openGraph.images[0].url, "https://wiki.example.test/images/tracks/mario-circuit.webp");
      assert.equal(metadata.openGraph.locale, "ko_KR");
      assert.match(metadata.title, /등록된 한글명 \(Mario Circuit\)/);
    }
    const catalog = pageMetadata("트랙 목록", "description", "/tracks");
    assert.equal(catalog.openGraph.images[0].url, "https://wiki.example.test/share-image");
    assert.equal(catalog.openGraph.images[0].width, 1200);
    delete process.env.SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    const unconfigured = pageMetadata("목록", "description", "/tracks");
    assert.equal(unconfigured.alternates, undefined);
    assert.deepEqual(unconfigured.openGraph.images, []);
    assert.equal(unconfigured.robots.index, false);
  } finally {
    for (const key of ["SITE_URL", "NODE_ENV", "VERCEL_ENV", "VERCEL_PROJECT_PRODUCTION_URL"]) {
      if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    }
  }
});
