import type { Track } from "../data/tracks";
import type { ShortcutBackup, ShortcutDraft } from "./shortcut-drafts";

export const shortcutAnchor = (id: string) => `shortcut-${encodeURIComponent(id)}`;

// Stable IDs let the original guides use the same links before and after saving.
export function initialShortcuts(track: Track): ShortcutDraft[] {
  return track.shortcuts.map((item, index) => ({
    id: `legacy-${track.slug}-${index + 1}`,
    title: item.name, summary: item.description, difficulty: item.difficulty,
    requirements: "", video: "",
    steps: [{ id: `legacy-step-${index + 1}`, text: item.description, image: "", caption: "" }],
  }));
}

export function publishedTrack(track: Track, saved: ShortcutBackup | null): Track {
  // An explicitly saved empty array means deletion, not missing content.
  const items = saved === null ? initialShortcuts(track) : saved.shortcuts;
  return { ...track, shortcuts: items.map((item) => ({
    id: item.id,
    name: item.title.trim() || "제목 미입력",
    difficulty: item.difficulty ?? null,
    description: (item.summary?.trim() || item.steps.find((step) => step.text.trim())?.text.trim() || item.requirements.trim() || "").slice(0, 240),
  })) };
}
