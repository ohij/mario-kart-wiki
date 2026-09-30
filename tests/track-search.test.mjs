import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
const source = await readFile(new URL("../lib/track-search.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { readSearchOptions, filterTracks, matchingShortcuts, updateSearchParams, resetSearchParams } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const base = { name: "Alpha", slug: "alpha", nameKo: "테스트 코스", aliases: ["별칭"], game: "Game", type: "Circuit", introducedIn: "1.0.0", cups: ["Example Cup"], summary: "Summary", description: "Description", difficulty: 2, sections: [], shortcuts: [{ id: "a", name: "Secret shortcut", description: "Hidden route" }], mechanics: ["Drifting"], strategies: [] };
const tracks = [base, { ...base, name: "Beta", slug: "beta", nameKo: undefined, aliases: [], parentSlug: "alpha", cups: [], difficulty: null, shortcuts: [], mechanics: [] }, { ...base, name: "Gamma", slug: "gamma", nameKo: undefined, aliases: [], cups: ["Other Cup"], difficulty: 4, shortcuts: [], mechanics: [] }];
const options = (query = "") => readSearchOptions(new URLSearchParams(query), ["Example Cup", "Other Cup"]);
const names = (query) => filterTracks(tracks, options(query)).map(({ name }) => name);

test("combined cup, course, guide and difficulty filters", () => {
  assert.deepEqual(names("cup=Example+Cup&course=main&guide=written&difficulty=easy"), ["Alpha"]);
  assert.deepEqual(names("course=snes&difficulty=unrated&guide=pending"), ["Beta"]);
  assert.deepEqual(names("course=snes&cup=Example+Cup"), []);
});
test("pending content remains discoverable while defaults stay unchanged", () => {
  assert.deepEqual(names("view=shortcuts"), ["Alpha"]);
  assert.deepEqual(names("view=shortcuts&guide=pending"), ["Beta", "Gamma"]);
  assert.deepEqual(names("view=mechanics&guide=written"), ["Alpha"]);
});
test("dedicated catalogs include unwritten tracks and respect guide filters", () => {
  const inclusive = (query) => filterTracks(tracks, options(query), true).map(({ name }) => name);
  assert.deepEqual(inclusive("view=shortcuts"), ["Alpha", "Beta", "Gamma"]);
  assert.deepEqual(inclusive("view=shortcuts&guide=written"), ["Alpha"]);
  assert.deepEqual(inclusive("view=shortcuts&guide=pending"), ["Beta", "Gamma"]);
  assert.deepEqual(inclusive("view=strategies"), ["Alpha", "Beta", "Gamma"]);
});
test("Korean names, aliases, normalized English and shortcut text", () => {
  for (const q of ["테스트", "별칭", "ＡＬＰＨＡ", "alpha hidden"]) assert.deepEqual(names(`q=${encodeURIComponent(q)}`), ["Alpha"]);
  assert.deepEqual(names("q=not-present"), []);
  assert.equal(matchingShortcuts(base, "hidden")[0].name, "Secret shortcut");
  assert.deepEqual(matchingShortcuts(base, ""), []);
});
test("name sorting does not mutate the catalog", () => {
  assert.deepEqual(names("sort=name-desc"), ["Gamma", "Beta", "Alpha"]);
  assert.deepEqual(names("sort=name-asc"), ["Alpha", "Beta", "Gamma"]);
  assert.deepEqual(tracks.map(({ name }) => name), ["Alpha", "Beta", "Gamma"]);
});
test("URL state is restored and invalid selections default", () => {
  const shared = "view=shortcuts&cup=Example+Cup&course=main&guide=written&difficulty=easy&sort=name-desc&q=Secret";
  assert.equal(options(shared).cup, "Example Cup");
  assert.equal(options(shared).sort, "name-desc");
  assert.deepEqual(names(shared), ["Alpha"]);
  assert.deepEqual(options("view=bad&cup=bad&course=bad&guide=bad&difficulty=bad&sort=bad"), options());
});
test("clear resets all filters while preserving view and unrelated params", () => {
  const original = new URLSearchParams("view=shortcuts&q=x&cup=Example+Cup&course=main&guide=written&difficulty=easy&sort=name-desc&extra=keep");
  assert.equal(updateSearchParams(original, "course", "all").has("course"), false);
  assert.equal(original.get("course"), "main");
  assert.equal(updateSearchParams(original, "q", "all").get("q"), "all");
  assert.equal(resetSearchParams(original).toString(), "view=shortcuts&extra=keep");
});
