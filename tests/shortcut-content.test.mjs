import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

// These pure modules have only type imports. Use the installed compiler without a new runner.
async function loadTypeScript(file) {
  const source = await readFile(new URL(file, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}
const { parseBackup, publicationIssues, localDraftKey, parseLocalDraft, writeLocalDraft } = await loadTypeScript("../lib/shortcut-drafts.ts");
const { publishedTrack, initialShortcuts, shortcutAnchor } = await loadTypeScript("../lib/shortcut-content.ts");
const { contentStatus } = await loadTypeScript("../lib/content-status.ts");
const track = { slug: "example", shortcuts: [{ name: "Original", difficulty: 2, description: "Original text" }] };
const oldItem = { id: "saved-id", title: "Saved", requirements: "Condition", video: "", steps: [{ id: "step-id", text: "First step", image: "", caption: "" }] };
const backup = (items) => ({ version: 1, track: track.slug, shortcuts: items });

test("admin status distinguishes legacy guides, unreviewed empty saves and confirmed absence", () => {
  const legacy = contentStatus(track, null, initialShortcuts(track), "empty");
  assert.equal(legacy.count, 1);
  assert.equal(legacy.status, "legacy");
  assert.equal(legacy.saved, false);
  assert.equal(legacy.updatedAt, null);
  assert.deepEqual(legacy.incomplete, ["영상 보완", "단계 이미지 보완"]);
  assert.equal(contentStatus(track, backup([]), [], "revision").status, "unreviewed");
  assert.equal(contentStatus(track, { ...backup([]), researchStatus: "no-shortcuts" }, [], "revision").status, "no-shortcuts");
  const item = { ...oldItem, video: "https://example.com/video.mp4", steps: [{ ...oldItem.steps[0], image: "https://example.com/image.png" }] };
  const saved = { ...backup([item]), updatedAt: "2026-09-28T00:00:00.000Z" };
  const row = contentStatus(track, saved, saved.shortcuts, "revision");
  assert.equal(row.status, "written");
  assert.equal(row.updatedAt, saved.updatedAt);
  assert.equal(row.videos, 1);
  assert.equal(row.images, 1);
  assert.deepEqual(row.incomplete, []);
});

test("old backups are compatible and invalid admin metadata is rejected", () => {
  assert.equal(parseBackup(backup([]), track.slug).updatedAt, undefined);
  assert.throws(() => parseBackup({ ...backup([]), updatedAt: "invalid" }, track.slug));
  assert.throws(() => parseBackup({ ...backup([]), researchStatus: "unknown" }, track.slug));
  assert.throws(() => parseBackup({ ...backup([oldItem]), researchStatus: "no-shortcuts" }, track.slug));
});

test("missing storage preserves original guides and stable deep links", () => {
  const published = publishedTrack(track, null);
  assert.equal(published.shortcuts[0].name, "Original");
  assert.equal(published.shortcuts[0].difficulty, 2);
  assert.equal(published.shortcuts[0].id, initialShortcuts(track)[0].id);
  assert.deepEqual(initialShortcuts(track), initialShortcuts(track));
  assert.equal(shortcutAnchor("saved-id"), "shortcut-saved-id");
});

test("saved empty list suppresses original guides", () => {
  assert.deepEqual(publishedTrack(track, backup([])).shortcuts, []);
});

test("old version 1 backup replaces originals without inventing difficulty", () => {
  const data = parseBackup(backup([oldItem]), track.slug);
  assert.deepEqual(publishedTrack(track, data).shortcuts, [{
    id: "saved-id", name: "Saved", difficulty: null, description: "First step",
  }]);
});

test("explicit summary and difficulty are preserved and media stays out of lists", () => {
  const item = { ...oldItem, summary: "  Searchable summary  ", difficulty: 4, video: "https://example.com/video.mp4" };
  const result = publishedTrack(track, parseBackup(backup([item]), track.slug)).shortcuts[0];
  assert.equal(result.description, "Searchable summary");
  assert.equal(result.difficulty, 4);
  assert.equal("steps" in result, false);
  assert.equal("video" in result, false);
});

test("blank summary uses a nonempty step then requirements and caps preview length", () => {
  const item = { ...oldItem, summary: " ", steps: [{ ...oldItem.steps[0], text: " " }, { ...oldItem.steps[0], id: "second", text: "Second step" }] };
  assert.equal(publishedTrack(track, backup([item])).shortcuts[0].description, "Second step");
  assert.equal(publishedTrack(track, backup([{ ...item, steps: [item.steps[0]] }])).shortcuts[0].description, "Condition");
  assert.equal(publishedTrack(track, backup([{ ...oldItem, summary: "x".repeat(300) }])).shortcuts[0].description.length, 240);
});

test("invalid metadata and mismatched backups are rejected", () => {
  for (const difficulty of [0, 6, 2.5, "3", false]) {
    assert.throws(() => parseBackup(backup([{ ...oldItem, difficulty }]), track.slug));
  }
  assert.throws(() => parseBackup(backup([{ ...oldItem, summary: 123 }]), track.slug));
  assert.throws(() => parseBackup(backup([oldItem]), "other-track"));
  assert.throws(() => parseBackup(backup([oldItem, oldItem]), track.slug));
});

test("publication reports each exact item, step and field while media remains optional", () => {
  assert.deepEqual(publicationIssues([oldItem]), []);
  assert.deepEqual(publicationIssues([]), []);
  const issues = publicationIssues([{ ...oldItem, title: " ", video: "http://example.com/video", steps: [{ ...oldItem.steps[0], text: " ", image: "unfinished" }] }]);
  assert.deepEqual(issues.map(({ item, step, field }) => [item, step, field]), [[0, undefined, "title"], [0, undefined, "video"], [0, 0, "text"], [0, 0, "image"]]);
  assert.match(issues[2].message, /숏컷 1 · 단계 1/);
  assert.equal(publicationIssues([{ ...oldItem, video: "https://youtube.com/watch?v=invalid" }])[0].field, "video");
});

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
const draft = () => ({ ...backup([{ ...oldItem, title: "", video: "unfinished", steps: [{ ...oldItem.steps[0], text: "", image: "http://unfinished" }] }]), baseRevision: "original-revision", savedAt: "2026-09-28T12:00:00.000Z" });

test("incomplete drafts survive a new session without becoming public backups", () => {
  const storage = memoryStorage();
  const raw = writeLocalDraft(storage, track.slug, draft(), null);
  const recovered = parseLocalDraft(storage.getItem(localDraftKey(track.slug)), track.slug);
  assert.deepEqual(recovered, draft());
  assert.equal(recovered.baseRevision, "original-revision");
  assert.throws(() => parseBackup(JSON.parse(raw), track.slug));
  assert.throws(() => parseLocalDraft(raw, "different-track"));
});

test("each track has its own draft and another tab cannot silently overwrite it", () => {
  const storage = memoryStorage();
  const raw = writeLocalDraft(storage, track.slug, draft(), null);
  const other = { ...draft(), track: "other" };
  writeLocalDraft(storage, "other", other, null);
  assert.equal(storage.getItem(localDraftKey(track.slug)), raw);
  storage.setItem(localDraftKey(track.slug), JSON.stringify({ ...draft(), savedAt: "2026-09-28T13:00:00Z" }));
  assert.throws(() => writeLocalDraft(storage, track.slug, draft(), raw), /다른 탭/);
  assert.notEqual(storage.getItem(localDraftKey(track.slug)), raw);
});

test("draft updates and deletion drafts preserve the original public revision", () => {
  const storage = memoryStorage();
  const raw = writeLocalDraft(storage, track.slug, draft(), null);
  const next = { ...draft(), shortcuts: [] };
  const updated = writeLocalDraft(storage, track.slug, next, raw);
  assert.deepEqual(parseLocalDraft(updated, track.slug).shortcuts, []);
  assert.equal(parseLocalDraft(updated, track.slug).baseRevision, "original-revision");
});

test("corrupt drafts and full browser storage produce errors without discarding data", () => {
  assert.throws(() => parseLocalDraft("broken json", track.slug));
  assert.throws(() => parseLocalDraft(JSON.stringify({ ...draft(), savedAt: "invalid" }), track.slug));
  assert.throws(() => parseLocalDraft(JSON.stringify({ ...draft(), baseRevision: "" }), track.slug));
  const storage = memoryStorage();
  const oversized = { ...draft(), shortcuts: [{ ...oldItem, summary: "x".repeat(2 * 1024 * 1024) }] };
  assert.throws(() => writeLocalDraft(storage, track.slug, oversized, null), /2MB/);
  assert.equal(storage.getItem(localDraftKey(track.slug)), null);
  assert.throws(() => writeLocalDraft({ getItem: () => null, setItem: () => { throw new Error("QuotaExceededError"); } }, track.slug, draft(), null), /QuotaExceededError/);
});
