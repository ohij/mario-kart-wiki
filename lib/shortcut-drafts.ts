export type ShortcutStep = { id: string; text: string; image: string; caption: string };
export type ShortcutDraft = { id: string; title: string; requirements: string; video: string; steps: ShortcutStep[] };
export type ShortcutBackup = { version: 1; track: string; shortcuts: ShortcutDraft[] };

export const newStep = (): ShortcutStep => ({ id: crypto.randomUUID(), text: "", image: "", caption: "" });
export const newShortcut = (): ShortcutDraft => ({ id: crypto.randomUUID(), title: "", requirements: "", video: "", steps: [newStep()] });

export function safeMedia(value: string, kind: "image" | "video") {
  if (!value) return true;
  void kind;
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

export function parseBackup(value: unknown, track: string): ShortcutBackup {
  const fail = () => { throw new Error("이 트랙의 올바른 숏컷 백업 파일이 아닙니다."); };
  if (!value || typeof value !== "object") return fail();
  const data = value as ShortcutBackup;
  if (data.version !== 1 || data.track !== track || !Array.isArray(data.shortcuts) || data.shortcuts.length > 100) return fail();
  const ids = new Set<string>();
  for (const item of data.shortcuts) {
    if (!item || typeof item.id !== "string" || ids.has(item.id) || typeof item.title !== "string" || typeof item.requirements !== "string" || typeof item.video !== "string" || !safeMedia(item.video, "video") || !Array.isArray(item.steps) || item.steps.length < 1 || item.steps.length > 100) return fail();
    ids.add(item.id);
    const steps = new Set<string>();
    for (const step of item.steps) {
      if (!step || typeof step.id !== "string" || steps.has(step.id) || typeof step.text !== "string" || typeof step.caption !== "string" || typeof step.image !== "string" || !safeMedia(step.image, "image")) return fail();
      steps.add(step.id);
    }
  }
  return data;
}

export function validateMedia(file: File, kind: "image" | "video") {
  const allowed = kind === "image" ? ["image/png", "image/jpeg", "image/webp", "image/gif"] : ["video/mp4", "video/webm", "video/ogg"];
  if (!allowed.includes(file.type)) throw new Error("지원하지 않는 파일 형식입니다.");
  if (file.size > (kind === "image" ? 10 : 100) * 1024 * 1024) throw new Error(kind === "image" ? "이미지는 10MB 이하로 선택해 주세요." : "영상은 100MB 이하로 선택해 주세요.");
}
