import type { Difficulty } from "../data/tracks";

export type ShortcutStep = { id: string; text: string; image: string; caption: string };
export type ShortcutDraft = { id: string; title: string; summary?: string; difficulty?: Difficulty | null; requirements: string; video: string; steps: ShortcutStep[] };
export type ShortcutBackup = { version: 1; track: string; shortcuts: ShortcutDraft[]; updatedAt?: string; researchStatus?: "unreviewed" | "no-shortcuts" };

export const newStep = (): ShortcutStep => ({ id: crypto.randomUUID(), text: "", image: "", caption: "" });
export const newShortcut = (): ShortcutDraft => ({ id: crypto.randomUUID(), title: "", summary: "", difficulty: null, requirements: "", video: "", steps: [newStep()] });

export function safeMedia(value: string, kind: "image" | "video") {
  if (!value) return true;
  const local = /^\/api\/shortcut-media\/[a-f0-9-]+\.(png|jpeg|webp|gif|mp4|webm|ogg)$/.exec(value);
  if (local) return (kind === "image" ? ["png", "jpeg", "webp", "gif"] : ["mp4", "webm", "ogg"]).includes(local[1]);
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

export function youtubeEmbed(value: string): string | null {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.slice(1);
    if (["youtube.com", "m.youtube.com"].includes(host)) {
      id = url.pathname === "/watch" ? url.searchParams.get("v") : /^\/(?:shorts|embed)\/([^/]+)$/.exec(url.pathname)?.[1] ?? null;
    }
    return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch { return null; }
}

export function parseBackup(value: unknown, track: string, checkMedia = true): ShortcutBackup {
  const fail = () => { throw new Error("이 트랙의 올바른 숏컷 백업 파일이 아닙니다."); };
  if (!value || typeof value !== "object") return fail();
  const data = value as ShortcutBackup;
  if (data.version !== 1 || data.track !== track || !Array.isArray(data.shortcuts) || data.shortcuts.length > 100) return fail();
  if (data.updatedAt !== undefined && (typeof data.updatedAt !== "string" || !Number.isFinite(Date.parse(data.updatedAt)))) return fail();
  if (data.researchStatus !== undefined && !["unreviewed", "no-shortcuts"].includes(data.researchStatus)) return fail();
  if (data.researchStatus === "no-shortcuts" && data.shortcuts.length) return fail();
  const ids = new Set<string>();
  for (const item of data.shortcuts) {
    if (!item || typeof item.id !== "string" || ids.has(item.id) || typeof item.title !== "string" || typeof item.requirements !== "string" || typeof item.video !== "string" || (checkMedia && !safeMedia(item.video, "video")) || !Array.isArray(item.steps) || item.steps.length < 1 || item.steps.length > 100) return fail();
    if ((item.summary !== undefined && typeof item.summary !== "string") || (item.difficulty !== undefined && item.difficulty !== null && ![1, 2, 3, 4, 5].includes(item.difficulty))) return fail();
    ids.add(item.id);
    const steps = new Set<string>();
    for (const step of item.steps) {
      if (!step || typeof step.id !== "string" || steps.has(step.id) || typeof step.text !== "string" || typeof step.caption !== "string" || typeof step.image !== "string" || (checkMedia && !safeMedia(step.image, "image"))) return fail();
      steps.add(step.id);
    }
  }
  return data;
}

export type PublishIssue = { item: number; step?: number; field: "title" | "text" | "video" | "image"; message: string };
export function publicationIssues(items: ShortcutDraft[]): PublishIssue[] {
  const issues: PublishIssue[] = [];
  items.forEach((item, index) => {
    const add = (field: PublishIssue["field"], message: string, step?: number) => issues.push({ item: index, step, field, message: `숏컷 ${index + 1}${step === undefined ? "" : ` · 단계 ${step + 1}`} · ${message}` });
    if (!item.title.trim()) add("title", "숏컷 이름을 입력해 주세요.");
    if (!safeMedia(item.video, "video")) add("video", "HTTPS 영상 주소 또는 업로드한 영상 주소를 입력해 주세요.");
    else if (item.video) {
      const host = (() => { try { return new URL(item.video).hostname.replace(/^www\./, ""); } catch { return ""; } })();
      if (["youtube.com", "m.youtube.com", "youtu.be"].includes(host) && !youtubeEmbed(item.video)) add("video", "올바른 YouTube 영상 링크를 입력해 주세요.");
    }
    item.steps.forEach((step, stepIndex) => {
      if (!step.text.trim()) add("text", "단계 설명을 입력해 주세요.", stepIndex);
      if (!safeMedia(step.image, "image")) add("image", "HTTPS 이미지 주소 또는 업로드한 이미지 주소를 입력해 주세요.", stepIndex);
    });
  });
  return issues;
}

export type LocalShortcutDraft = ShortcutBackup & { baseRevision: string; savedAt: string };
export const localDraftKey = (slug: string) => `mkw-shortcut-draft:${slug}`;
export function parseLocalDraft(raw: string, slug: string): LocalShortcutDraft {
  const value = JSON.parse(raw);
  const data = parseBackup(value, slug, false);
  if (typeof value.baseRevision !== "string" || !value.baseRevision || typeof value.savedAt !== "string" || !Number.isFinite(Date.parse(value.savedAt))) throw new Error("브라우저 초안 형식이 올바르지 않습니다. 원본을 내보낸 뒤 확인해 주세요.");
  return { ...data, baseRevision: value.baseRevision, savedAt: value.savedAt };
}

export function writeLocalDraft(storage: Pick<Storage, "getItem" | "setItem">, slug: string, draft: LocalShortcutDraft, expected: string | null): string {
  const key = localDraftKey(slug);
  if (storage.getItem(key) !== expected) throw new Error("다른 탭에서 브라우저 초안이 변경되었습니다. 현재 내용을 백업한 뒤 초안을 다시 확인해 주세요.");
  const raw = JSON.stringify(draft);
  if (new TextEncoder().encode(raw).byteLength > 2 * 1024 * 1024) throw new Error("초안은 2MB 이하로 보관할 수 있습니다. 백업을 내보내고 내용을 줄여 주세요.");
  storage.setItem(key, raw);
  return raw;
}

export function validateMedia(file: File, kind: "image" | "video") {
  const allowed = kind === "image" ? ["image/png", "image/jpeg", "image/webp", "image/gif"] : ["video/mp4", "video/webm", "video/ogg"];
  if (!allowed.includes(file.type)) throw new Error("지원하지 않는 파일 형식입니다.");
  if (file.size > (kind === "image" ? 10 : 100) * 1024 * 1024) throw new Error(kind === "image" ? "이미지는 10MB 이하로 선택해 주세요." : "영상은 100MB 이하로 선택해 주세요.");
}
