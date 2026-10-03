"use client";

/* External HTTPS images are supplied by the administrator, without a fixed host allowlist. */
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GoogleAdminLogin from "@/app/components/google-admin-login";
import type { Difficulty } from "@/data/tracks";
import { shortcutAnchor } from "@/lib/shortcut-content";
import { newShortcut, newStep, parseBackup, validateMedia, safeMedia, youtubeEmbed, publicationIssues, localDraftKey, parseLocalDraft, writeLocalDraft, type LocalShortcutDraft, type PublishIssue, type ShortcutDraft, type ShortcutStep } from "@/lib/shortcut-drafts";

export default function ShortcutEditor({ slug, initial, initialError = "" }: { slug: string; initial: ShortcutDraft[]; initialError?: string }) {
  const router = useRouter();
  const initialItems = useRef(initial);
  const [items, setItems] = useState<ShortcutDraft[]>(initial);
  const [ready, setReady] = useState(false);
  const [contentError, setContentError] = useState(initialError);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [localStorage, setLocalStorage] = useState(false);
  const [storage, setStorage] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [revision, setRevision] = useState("empty");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingDraft, setPendingDraft] = useState<LocalShortcutDraft | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState("");
  const [draftError, setDraftError] = useState("");
  const [draftBlocked, setDraftBlocked] = useState(false);
  const [issues, setIssues] = useState<PublishIssue[]>([]);
  const [latest, setLatest] = useState<{ items: ShortcutDraft[]; revision: string } | null>(null);
  const draftRaw = useRef<string | null>(null);

  const checkDraft = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(localDraftKey(slug));
      draftRaw.current = raw;
      const draft = raw ? parseLocalDraft(raw, slug) : null;
      setPendingDraft(draft); setDraftBlocked(false); setDraftError("");
      return Boolean(draft);
    } catch (reason) {
      setDraftBlocked(draftRaw.current !== null);
      setDraftError(`브라우저 초안을 읽지 못했습니다. 원본 내보내기 후 확인해 주세요. ${reason instanceof Error ? reason.message : "브라우저 저장 공간 접근 오류"}`);
      return draftRaw.current !== null;
    }
  }, [slug]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    fetch(`/api/tracks/${slug}/shortcuts`, { cache: "no-store", signal: controller.signal }).then(responseJson).then((saved) => {
      if (!active) return;
      setItems(saved.data ? parseBackup(saved.data, slug).shortcuts : initialItems.current);
      setRevision(saved.revision);
      setContentError("");
      setReady(true);
    }).catch(() => { if (active) setContentError("숏컷을 불러오지 못했습니다. 다시 불러오기를 눌러 주세요. 관리자 로그인은 사용할 수 있습니다."); })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; controller.abort(); clearTimeout(timeout); };
  }, [slug, loadAttempt]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    fetch("/api/shortcut-admin", { cache: "no-store", signal: controller.signal }).then(responseJson).then((auth) => {
      if (!active) return;
      setAdmin(auth.authenticated); setConfigured(auth.configured); setStorage(auth.storage); setLocalStorage(auth.localStorage === true);
      const authError = new URLSearchParams(window.location.search).get("authError");
      if (authError) { setLoginOpen(true); setError(authError === "forbidden" ? "등록된 관리자 Google 계정이 아닙니다." : authError === "cancelled" ? "Google 로그인을 취소했습니다." : "Google 로그인 요청이 만료되었거나 인증에 실패했습니다. 다시 로그인해 주세요."); }
      if (auth.authenticated) checkDraft();
    }).catch(() => { if (active) setError("로그인 상태를 확인하지 못했습니다. 관리자 로그인에서 다시 시도해 주세요."); })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; controller.abort(); clearTimeout(timeout); };
  }, [checkDraft]);

  useEffect(() => {
    if (!admin) return;
    const changed = (event: StorageEvent) => {
      if ((event.key === localDraftKey(slug) || event.key === null) && event.newValue !== draftRaw.current) {
        setDraftBlocked(true);
        setDraftError("다른 탭에서 브라우저 초안이 변경되었습니다. 작성 중인 내용은 유지됩니다. 백업을 내보낸 뒤 브라우저 초안을 확인해 주세요.");
      }
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, [admin, slug]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const guard = (event: MouseEvent) => {
      if ((event.target as Element).closest("a[href]") && !window.confirm("저장하지 않은 변경이 있습니다. 페이지를 이동할까요?")) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", guard, true);
    return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("click", guard, true); };
  }, [dirty]);

  function persistDraft(next: ShortcutDraft[], baseRevision = revision) {
    try {
      const savedAt = new Date().toISOString();
      draftRaw.current = writeLocalDraft(window.localStorage, slug, { version: 1, track: slug, shortcuts: next, baseRevision, savedAt }, draftRaw.current);
      setDraftSavedAt(savedAt); setDraftError(""); return true;
    } catch (reason) {
      setDraftError(`초안 자동 보관에 실패했습니다. 백업을 내보내 주세요. ${reason instanceof Error ? reason.message : "브라우저 저장 공간 접근 오류"}`);
      return false;
    }
  }
  function clearOwnedDraft() {
    try {
      if (window.localStorage.getItem(localDraftKey(slug)) !== draftRaw.current) {
        setDraftBlocked(true); setDraftError("다른 탭에서 보관한 초안은 삭제하지 않았습니다. 브라우저 초안을 확인해 주세요."); return;
      }
      window.localStorage.removeItem(localDraftKey(slug));
      draftRaw.current = null; setPendingDraft(null); setDraftSavedAt(""); setDraftError(""); setDraftBlocked(false);
    } catch { setDraftError("공개 내용은 저장되었지만 브라우저 초안을 정리하지 못했습니다. 브라우저 저장 공간을 확인해 주세요."); }
  }
  function change(next: ShortcutDraft[]) { setItems(next); setDirty(true); setMessage(""); setIssues([]); persistDraft(next); }
  function update(id: string, patch: Partial<ShortcutDraft>) { change(items.map((item) => item.id === id ? { ...item, ...patch } : item)); }
  function stepUpdate(item: ShortcutDraft, id: string, patch: Partial<ShortcutStep>) { update(item.id, { steps: item.steps.map((step) => step.id === id ? { ...step, ...patch } : step) }); }
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(""); setMessage("");
    try { await action(); } catch (reason) { setError(reason instanceof Error ? reason.message : "작업에 실패했습니다. 다시 시도해 주세요."); }
    finally { setBusy(false); }
  }
  const backup = () => parseBackup({ version: 1, track: slug, shortcuts: items }, slug, false);
  async function uploadMedia(file: File, kind: "image" | "video") {
    validateMedia(file, kind);
    if (localStorage) {
      setMessage("파일 업로드 중…");
      const response = await fetch(`/api/shortcut-upload?slug=${encodeURIComponent(slug)}`, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      return (await responseJson(response)).url as string;
    }
    const ext = file.type.split("/")[1];
    const result = await upload(`shortcuts/media/${slug}/${crypto.randomUUID()}.${ext}`, file, {
      access: "public", handleUploadUrl: "/api/shortcut-upload", multipart: file.size > 4 * 1024 * 1024,
      onUploadProgress: ({ percentage }) => setMessage(`파일 업로드 중… ${Math.round(percentage)}%`),
    });
    return result.url;
  }
  async function save() {
    const found = publicationIssues(items);
    setIssues(found);
    if (found.length) { setPreview(false); setError("공개하기 전에 아래 입력 항목을 확인해 주세요."); return; }
    await run(async () => {
      const data = backup();
      const raw = JSON.stringify(data);
      if (new Blob([raw]).size > 2 * 1024 * 1024) throw new Error("설명 내용은 트랙당 2MB 이하로 작성해 주세요.");
      const response = await fetch(`/api/tracks/${slug}/shortcuts`, { method: "PUT", headers: { "Content-Type": "application/json", "If-Match": revision }, body: raw });
      if (response.status === 401) { setAdmin(false); setLoginOpen(true); setPreview(true); }
      if (response.status === 409) {
        await readLatest();
      }
      const result = await responseJson(response);
      setItems(parseBackup(result.data, slug).shortcuts); setRevision(result.revision);
      setDirty(false); setMessage("웹사이트에 저장했습니다. 방문자에게도 공개됩니다.");
      setLatest(null); clearOwnedDraft();
      router.refresh();
    });
  }
  async function readLatest() {
    const saved = await fetch(`/api/tracks/${slug}/shortcuts`, { cache: "no-store", signal: AbortSignal.timeout(15000) }).then(responseJson);
    setLatest({ items: saved.data ? parseBackup(saved.data, slug).shortcuts : initialItems.current, revision: saved.revision });
  }
  function exportBackup() {
    void run(async () => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup())], { type: "application/json" }));
      const link = document.createElement("a"); link.href = url; link.download = `${slug}-shortcuts.json`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("작성 내용과 미디어 주소를 백업했습니다. 업로드한 원본 파일은 별도로 보관해 주세요.");
    });
  }

  return <div className="shortcut-workspace">
    <div className="shortcut-toolbar">
      <p>영상과 단계별 이미지로 숏컷을 익혀 보세요.</p>
      {admin && <Link className="shortcut-page-link" href="/admin/content">관리자 콘텐츠 현황</Link>}
      {admin ? <button type="button" disabled={busy} onClick={() => {
        if (dirty && !window.confirm("저장하지 않은 변경이 있습니다. 로그아웃할까요?")) return;
        void run(async () => { await fetch("/api/shortcut-admin", { method: "DELETE" }).then(responseJson); window.location.reload(); });
      }}>관리자 로그아웃</button> : <button type="button" disabled={busy} aria-expanded={loginOpen} aria-controls="shortcut-login" onClick={() => setLoginOpen(!loginOpen)}>관리자 로그인</button>}
    </div>
    {loginOpen && !admin && <GoogleAdminLogin configured={configured} disabled={busy} />}
    {admin && <p className="guide-pending">관리자만 수정할 수 있습니다. ‘저장·공개’를 누르면 모든 방문자에게 반영됩니다. 파일 업로드 후에도 저장 버튼을 눌러 주세요.</p>}
    {admin && !storage && <p role="alert" className="shortcut-error">Vercel Blob 저장소가 연결되지 않았습니다. 연결 후 파일 업로드와 저장을 사용할 수 있습니다.</p>}
    <div role="status" aria-live="polite">{message || (ready ? dirty ? "저장하지 않은 변경이 있습니다." : "" : contentError ? "" : "숏컷 불러오는 중…")}</div>
    {contentError && <div><p role="alert" className="shortcut-error">{contentError}</p><button type="button" disabled={busy} onClick={() => { setContentError(""); setLoadAttempt((attempt) => attempt + 1); }}>숏컷 다시 불러오기</button></div>}
    {error && <p role="alert" className="shortcut-error">{error}</p>}
    {admin && <>
      <p className="guide-pending">초안은 이 브라우저에만 자동 보관됩니다. 방문자에게 공개하려면 ‘저장·공개’를 눌러 주세요.</p>
      {draftSavedAt && <p role="status">브라우저 초안 보관: {new Date(draftSavedAt).toLocaleString()}</p>}
      {draftError && <p role="alert" className="shortcut-error">{draftError}</p>}
      {(pendingDraft || draftBlocked) && <div className="shortcut-login">
        {pendingDraft && <p>복구할 초안이 있습니다. {new Date(pendingDraft.savedAt).toLocaleString()}{pendingDraft.baseRevision !== revision && " · 초안 작성 이후 공개 내용이 변경되었습니다."}</p>}
        <div className="shortcut-toolbar">
          {pendingDraft && <button type="button" disabled={!ready || busy} onClick={() => {
            if (dirty && !window.confirm("작성 중인 내용을 보관된 초안으로 바꿀까요? 먼저 백업을 내보낼 수 있습니다.")) return;
            if (pendingDraft.baseRevision !== revision && !window.confirm("초안 작성 이후 공개 내용이 변경되었습니다. 최신 공개 버전을 기준으로 이 초안을 계속 편집할까요? 실제 공개는 저장·공개 버튼을 눌러야 합니다.")) return;
            setItems(pendingDraft.shortcuts); setDirty(true); setPreview(false); setIssues([]);
            persistDraft(pendingDraft.shortcuts, revision); setPendingDraft(null);
            setMessage("최신 공개 버전을 기준으로 초안을 복구했습니다. 공개 내용은 아직 변경되지 않았습니다.");
          }}>초안 복구</button>}
          <button type="button" disabled={busy} onClick={checkDraft}>브라우저 초안 확인</button>
          {draftBlocked && <button type="button" disabled={busy} onClick={exportBackup}>현재 편집 내용 백업</button>}
          <button type="button" disabled={busy} onClick={() => void run(async () => {
            const raw = window.localStorage.getItem(localDraftKey(slug));
            if (!raw) throw new Error("보관된 초안이 없습니다.");
            downloadJson(raw, `${slug}-browser-draft.json`);
          })}>보관된 초안 원본 내보내기</button>
          <button type="button" disabled={busy} onClick={() => {
            if (!window.confirm("이 브라우저에 보관된 초안을 삭제할까요? 공개 내용과 현재 편집 내용은 유지됩니다.")) return;
            clearOwnedDraft();
            if (dirty) persistDraft(items);
          }}>보관된 초안 삭제</button>
          {dirty && <button type="button" disabled={busy} onClick={exportBackup}>현재 편집 내용 백업</button>}
        </div>
      </div>}
      {latest && <div className="shortcut-login">
        <h2>최신 공개 내용 확인</h2>
        <p>내 초안은 그대로 유지되어 있습니다. 최신 내용과 비교한 뒤 공개 기준을 선택해 주세요.</p>
        {latest.items.length === 0 && <p>공개 숏컷이 없습니다.</p>}
        {latest.items.map((item) => <details key={item.id}><summary>{item.title}</summary><p className="shortcut-prose">{item.summary}</p><p className="shortcut-prose">{item.requirements}</p>{item.steps.map((step, index) => <p className="shortcut-prose" key={step.id}>단계 {index + 1}: {step.text}</p>)}</details>)}
        <div className="shortcut-toolbar">
          <button type="button" disabled={busy} onClick={() => {
            if (!window.confirm("최신 공개 내용을 확인했으며, 내 초안을 기준으로 계속 편집할까요? 실제 공개는 저장·공개 버튼을 눌러야 합니다.")) return;
            setRevision(latest.revision); persistDraft(items, latest.revision); setLatest(null); setError("");
          }}>내 초안으로 계속 편집</button>
          <button type="button" disabled={busy} onClick={exportBackup}>내 초안 백업</button>
        </div>
      </div>}
      {issues.length > 0 && <div role="alert" className="shortcut-error"><ul>{issues.map((issue, index) => <li key={index}><button type="button" onClick={() => {
        setPreview(false);
        requestAnimationFrame(() => document.getElementById(`publish-${issue.item}-${issue.step ?? "item"}-${issue.field}`)?.focus());
      }}>{issue.message}</button></li>)}</ul></div>}
    </>}
    <fieldset disabled={!ready || busy || Boolean(pendingDraft) || draftBlocked} className="shortcut-controls">
      <legend className="shortcut-sr-only">숏컷 편집 도구</legend>
      {admin && <div className="shortcut-toolbar">
        <button type="button" onClick={() => setPreview(!preview)}>{preview ? "편집하기" : "미리보기"}</button>
        <button type="button" onClick={() => { if (persistDraft(items)) setMessage("초안을 이 브라우저에 보관했습니다. 아직 공개되지 않았습니다."); }}>초안 보관</button>
        <button type="button" className="shortcut-primary" disabled={!storage || Boolean(latest)} onClick={save}>{busy ? "처리 중…" : "저장·공개"}</button>
        <button type="button" onClick={exportBackup}>백업 내보내기</button>
        {dirty && <button type="button" onClick={() => void run(readLatest)}>최신 공개 내용 확인</button>}
        <label className="shortcut-file-button">백업 불러오기<input type="file" accept=".json,application/json" onChange={(event) => {
          const file = event.target.files?.[0]; event.target.value = "";
          if (!file || (dirty && !window.confirm("작성 중인 내용을 백업 내용으로 바꿀까요?"))) return;
          void run(async () => {
            if (file.size > 2 * 1024 * 1024) throw new Error("백업은 2MB 이하여야 합니다.");
            const data = parseBackup(JSON.parse(await file.text()), slug, false);
            if (!dirty && !window.confirm("현재 내용을 백업 내용으로 바꿀까요?")) return;
            change(data.shortcuts); setMessage("백업을 불러왔습니다. 저장·공개 버튼을 눌러 반영해 주세요.");
          });
        }} /></label>
      </div>}
      {!contentError && items.length === 0 && <p className="guide-pending">아직 등록된 숏컷이 없습니다.{admin && " 아래 버튼으로 템플릿을 추가해 주세요."}</p>}
      {items.map((item, index) => <article className="shortcut-template" id={shortcutAnchor(item.id)} key={item.id}>
        <div className="shortcut-template-heading"><h2>숏컷 {index + 1}{preview && ` · ${item.title || "제목 미입력"}`}</h2>
          {!preview && <button type="button" onClick={() => { if (window.confirm("이 숏컷과 첨부 자료를 삭제할까요?")) change(items.filter((entry) => entry.id !== item.id)); }}>숏컷 삭제</button>}
        </div>
        {!preview && <label>숏컷 이름<input id={`publish-${index}-item-title`} aria-invalid={issues.some((issue) => issue.item === index && issue.field === "title")} value={item.title} placeholder="예: 마지막 코너 버섯 숏컷" onChange={(e) => update(item.id, { title: e.target.value })} /></label>}
        {!preview && <>
          <label>목록용 요약<textarea rows={2} value={item.summary ?? ""} placeholder="홈·검색·트랙 상세에 표시할 짧은 설명. 비워 두면 첫 단계 설명을 사용합니다." onChange={(e) => update(item.id, { summary: e.target.value })} /></label>
          <label>숏컷 난이도<select value={item.difficulty ?? ""} onChange={(e) => update(item.id, { difficulty: e.target.value ? Number(e.target.value) as Difficulty : null })}>
            <option value="">미평가</option>
            {[1, 2, 3, 4, 5].map((level) => <option value={level} key={level}>{level}/5</option>)}
          </select></label>
        </>}
        {preview && <>
          <p className="image-credit">숏컷 난이도 · {item.difficulty ? `${item.difficulty}/5` : "미평가"}</p>
          {item.summary && <p className="shortcut-prose">{item.summary}</p>}
        </>}
        {preview ? item.requirements && <p className="shortcut-prose">{item.requirements}</p> : <label>준비 조건 / 사용 아이템<textarea rows={2} value={item.requirements} placeholder="필요한 아이템, 진입 위치, 주의 사항을 적어 주세요." onChange={(e) => update(item.id, { requirements: e.target.value })} /></label>}
        <h3>숏컷 영상</h3>
        {!preview && <>
          <label>영상 URL<input id={`publish-${index}-item-video`} aria-invalid={issues.some((issue) => issue.item === index && issue.field === "video")} type="url" value={item.video.startsWith("data:") ? "" : item.video} placeholder="YouTube 링크 또는 HTTPS MP4 / WebM 영상 주소" onChange={(e) => update(item.id, { video: e.target.value })} /></label>
          <label>또는 영상 파일 (MP4 / WebM / Ogg, 최대 100MB)<input type="file" accept="video/mp4,video/webm,video/ogg" onChange={(e) => {
            const file = e.target.files?.[0]; e.target.value = "";
            if (file) void run(async () => update(item.id, { video: await uploadMedia(file, "video") }));
          }} /></label>
          {item.video && <button type="button" onClick={() => update(item.id, { video: "" })}>영상 제거</button>}
        </>}
        {item.video ? !safeMedia(item.video, "video") ? <p className="shortcut-error">HTTPS 영상 주소를 입력해 주세요.</p> : youtubeEmbed(item.video) ? <iframe className="shortcut-video" src={youtubeEmbed(item.video)!} title={`${item.title || `숏컷 ${index + 1}`} 영상`} allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /> : <><video className="shortcut-video" src={item.video} controls preload="metadata" /><p className="image-credit">영상이 재생되지 않으면 MP4 / WebM 직접 주소 또는 지원되는 파일을 사용해 주세요.</p></> : <div className="shortcut-placeholder">숏컷 영상을 추가해 주세요.</div>}
        <h3>숏컷 하는 방법</h3>
        {item.steps.map((step, stepIndex) => <section className="shortcut-step" key={step.id}>
          <h4>STEP {stepIndex + 1}</h4>
          {preview ? <p className="shortcut-prose">{step.text || "단계 설명을 입력해 주세요."}</p> : <>
            <label>단계 설명<textarea id={`publish-${index}-${stepIndex}-text`} aria-invalid={issues.some((issue) => issue.item === index && issue.step === stepIndex && issue.field === "text")} rows={5} value={step.text} placeholder="진입 위치 → 드리프트 / 점프 타이밍 → 착지와 복귀 순서로 적어 주세요." onChange={(e) => stepUpdate(item, step.id, { text: e.target.value })} /></label>
            <label>설명 이미지 (PNG / JPEG / WebP / GIF, 최대 10MB)<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => {
              const file = e.target.files?.[0]; e.target.value = "";
              if (file) void run(async () => stepUpdate(item, step.id, { image: await uploadMedia(file, "image") }));
            }} /></label>
            <label>또는 이미지 URL<input id={`publish-${index}-${stepIndex}-image`} aria-invalid={issues.some((issue) => issue.item === index && issue.step === stepIndex && issue.field === "image")} type="url" value={step.image.startsWith("data:") ? "" : step.image} placeholder="https://…" onChange={(e) => stepUpdate(item, step.id, { image: e.target.value })} /></label>
            <label>이미지 설명<textarea rows={2} value={step.caption} placeholder="화살표가 가리키는 지점에서 점프합니다." onChange={(e) => stepUpdate(item, step.id, { caption: e.target.value })} /></label>
          </>}
          {step.image && (safeMedia(step.image, "image") ? <figure><img src={step.image} alt={step.caption || `숏컷 ${index + 1} 단계 ${stepIndex + 1} 참고 이미지`} loading="lazy" /><figcaption>{step.caption}</figcaption></figure> : <p className="shortcut-error">HTTPS 이미지 주소를 입력해 주세요.</p>)}
          {!preview && <div className="shortcut-toolbar">
            {step.image && <button type="button" onClick={() => stepUpdate(item, step.id, { image: "" })}>이미지 제거</button>}
            <button type="button" disabled={stepIndex === 0} onClick={() => {
              const steps = [...item.steps]; [steps[stepIndex - 1], steps[stepIndex]] = [steps[stepIndex], steps[stepIndex - 1]]; update(item.id, { steps });
            }}>위로 이동</button>
            <button type="button" disabled={item.steps.length === 1} onClick={() => { if (window.confirm("이 단계의 설명과 이미지를 삭제할까요?")) update(item.id, { steps: item.steps.filter((entry) => entry.id !== step.id) }); }}>단계 삭제</button>
          </div>}
        </section>)}
        {!preview && <button type="button" disabled={item.steps.length >= 100} onClick={() => update(item.id, { steps: [...item.steps, newStep()] })}>+ 설명·이미지 단계 추가</button>}
      </article>)}
      {!preview && <button type="button" className="shortcut-primary" disabled={items.length >= 100} onClick={() => change([...items, newShortcut()])}>+ 숏컷 템플릿 추가</button>}
    </fieldset>
  </div>;
}

async function responseJson(response: Response) {
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "요청에 실패했습니다. 다시 시도해 주세요.");
  return body;
}

function downloadJson(raw: string, name: string) {
  const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
