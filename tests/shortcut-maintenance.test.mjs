import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseFullBackup, localMediaReferences, replaceMedia, restoreBackup } from "../scripts/shortcut-maintenance.mjs";

const catalog = JSON.parse(await readFile(new URL("../data/track-catalog.json", import.meta.url), "utf8"));
const backup = () => ({ version: 1, tracks: catalog.map(({ slug }) => ({ slug, saved: false, content: { version: 1, track: slug, shortcuts: [] } })) });

test("full restore validates every track before writing and rejects partial, duplicate and malformed backups", () => {
  const valid = backup();
  assert.equal(parseFullBackup(valid).tracks.length, 40);
  assert.throws(() => parseFullBackup({ ...valid, tracks: valid.tracks.slice(1) }), /40/);
  const duplicate = backup(); duplicate.tracks[0] = duplicate.tracks[1];
  assert.throws(() => parseFullBackup(duplicate), /slug/);
  const invalid = backup(); invalid.tracks[0].content.track = "wrong";
  assert.throws(() => parseFullBackup(invalid), /백업/);
  const badState = backup(); badState.tracks[0].saved = "false";
  assert.throws(() => parseFullBackup(badState), /저장/);
});

test("migration deduplicates media, changes only URLs, and preserves source backup and metadata", () => {
  const original = backup();
  const row = original.tracks[0]; row.saved = true;
  row.content.updatedAt = "2026-09-29T00:00:00.000Z";
  row.content.shortcuts = [{ id: "one", title: "Title", summary: "Summary", difficulty: 2, requirements: "Condition", video: "/api/shortcut-media/abc.mp4", steps: [{ id: "step", text: "Instruction", caption: "Caption", image: "/api/shortcut-media/def.png" }, { id: "step2", text: "Next", caption: "", image: "/api/shortcut-media/def.png" }] }];
  parseFullBackup(original);
  assert.equal(localMediaReferences(original).size, 2);
  const migrated = replaceMedia(original, { "/api/shortcut-media/abc.mp4": "https://example.test/video.mp4", "/api/shortcut-media/def.png": "https://example.test/image.png" });
  assert.equal(localMediaReferences(migrated).size, 0);
  assert.equal(migrated.tracks[0].content.updatedAt, row.content.updatedAt);
  assert.equal(migrated.tracks[0].content.shortcuts[0].difficulty, 2);
  assert.equal(migrated.tracks[0].content.shortcuts[0].steps[1].image, "https://example.test/image.png");
  assert.equal(localMediaReferences(original).size, 2);
  assert.throws(() => replaceMedia(original, { "/api/shortcut-media/def.png": "javascript:alert(1)" }), /백업/);
});

test("restore rejects unsafe targets without making a network request", async () => {
  for (const base of ["http://example.test", "https://user:secret@example.test", "https://example.test/path", "https://example.test?query=1"]) await assert.rejects(restoreBackup(backup(), base), /origin/);
});
