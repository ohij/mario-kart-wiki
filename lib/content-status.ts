import type { Track } from "../data/tracks";
import type { ShortcutBackup, ShortcutDraft } from "./shortcut-drafts";

export type ContentStatus = {
  slug: string; name: string; nameKo?: string; count: number; saved: boolean;
  status: "unreviewed" | "no-shortcuts" | "written" | "legacy" | "error";
  updatedAt: string | null; videos: number; images: number; steps: number;
  incomplete: string[]; revision: string; error?: string;
};

export function contentStatus(track: Track, data: ShortcutBackup | null, items: ShortcutDraft[], revision: string): ContentStatus {
  const videos = items.filter((item) => item.video.trim()).length;
  const steps = items.flatMap((item) => item.steps);
  const images = steps.filter((step) => step.image.trim()).length;
  const incomplete: string[] = [];
  if (items.some((item) => !item.title.trim())) incomplete.push("숏컷 이름 미입력");
  if (steps.some((step) => !step.text.trim())) incomplete.push("단계 설명 미입력");
  if (items.length && videos < items.length) incomplete.push("영상 보완");
  if (steps.length && images < steps.length) incomplete.push("단계 이미지 보완");
  return { slug: track.slug, name: track.name, nameKo: track.nameKo, count: items.length, saved: data !== null,
    status: data === null ? items.length ? "legacy" : "unreviewed" : items.length ? "written" : data.researchStatus === "no-shortcuts" ? "no-shortcuts" : "unreviewed",
    updatedAt: data?.updatedAt ?? null, videos, images, steps: steps.length, incomplete, revision };
}
