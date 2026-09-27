"use client";

/* External HTTPS images are supplied by the administrator, without a fixed host allowlist. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";
import type { Shortcut } from "@/data/tracks";
import { newShortcut, newStep, parseBackup, validateMedia, safeMedia, youtubeEmbed, type ShortcutDraft, type ShortcutStep } from "@/lib/shortcut-drafts";

export default function ShortcutEditor({ slug, initial }: { slug: string; initial: Shortcut[] }) {
  const [items, setItems] = useState<ShortcutDraft[]>([]);
  const [ready, setReady] = useState(false);
  const [contentError, setContentError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [storage, setStorage] = useState(false);
  const [password, setPassword] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [revision, setRevision] = useState("empty");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    fetch(`/api/tracks/${slug}/shortcuts`, { cache: "no-store", signal: controller.signal }).then(responseJson).then((saved) => {
      if (!active) return;
      setItems(saved.data ? parseBackup(saved.data, slug).shortcuts : initial.map((item) => ({ ...newShortcut(), title: item.name, steps: [{ ...newStep(), text: item.description }] })));
      setRevision(saved.revision);
      setContentError("");
      setReady(true);
    }).catch(() => { if (active) setContentError("숏컷을 불러오지 못했습니다. 다시 불러오기를 눌러 주세요. 관리자 로그인은 사용할 수 있습니다."); })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; controller.abort(); clearTimeout(timeout); };
  }, [slug, initial, loadAttempt]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    fetch("/api/shortcut-admin", { cache: "no-store", signal: controller.signal }).then(responseJson).then((auth) => {
      if (!active) return;
      setAdmin(auth.authenticated); setConfigured(auth.configured); setStorage(auth.storage);
    }).catch(() => { if (active) setError("로그인 상태를 확인하지 못했습니다. 관리자 로그인에서 다시 시도해 주세요."); })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; controller.abort(); clearTimeout(timeout); };
  }, []);

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

  function change(next: ShortcutDraft[]) { setItems(next); setDirty(true); setMessage(""); }
  function update(id: string, patch: Partial<ShortcutDraft>) { change(items.map((item) => item.id === id ? { ...item, ...patch } : item)); }
  function stepUpdate(item: ShortcutDraft, id: string, patch: Partial<ShortcutStep>) { update(item.id, { steps: item.steps.map((step) => step.id === id ? { ...step, ...patch } : step) }); }
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(""); setMessage("");
    try { await action(); } catch (reason) { setError(reason instanceof Error ? reason.message : "작업에 실패했습니다. 다시 시도해 주세요."); }
    finally { setBusy(false); }
  }
  const backup = () => parseBackup({ version: 1, track: slug, shortcuts: items }, slug);
  async function uploadMedia(file: File, kind: "image" | "video") {
    validateMedia(file, kind);
    const ext = file.type.split("/")[1];
    const result = await upload(`shortcuts/media/${slug}/${crypto.randomUUID()}.${ext}`, file, {
      access: "public", handleUploadUrl: "/api/shortcut-upload", multipart: file.size > 4 * 1024 * 1024,
      onUploadProgress: ({ percentage }) => setMessage(`파일 업로드 중… ${Math.round(percentage)}%`),
    });
    return result.url;
  }
  async function save() {
    await run(async () => {
      const data = backup();
      const raw = JSON.stringify(data);
      if (new Blob([raw]).size > 2 * 1024 * 1024) throw new Error("설명 내용은 트랙당 2MB 이하로 작성해 주세요.");
      const response = await fetch(`/api/tracks/${slug}/shortcuts`, { method: "PUT", headers: { "Content-Type": "application/json", "If-Match": revision }, body: raw });
      if (response.status === 401) { setAdmin(false); setLoginOpen(true); setPreview(true); }
      const result = await responseJson(response);
      setItems(parseBackup(result.data, slug).shortcuts); setRevision(result.revision);
      setDirty(false); setMessage("웹사이트에 저장했습니다. 방문자에게도 공개됩니다.");
    });
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
      {admin ? <button type="button" disabled={busy} onClick={() => {
        if (dirty && !window.confirm("저장하지 않은 변경이 있습니다. 로그아웃할까요?")) return;
        void run(async () => { await fetch("/api/shortcut-admin", { method: "DELETE" }).then(responseJson); window.location.reload(); });
      }}>관리자 로그아웃</button> : <button type="button" disabled={busy} aria-expanded={loginOpen} aria-controls="shortcut-login" onClick={() => setLoginOpen(!loginOpen)}>관리자 로그인</button>}
    </div>
    {loginOpen && !admin && <form id="shortcut-login" className="shortcut-login" onSubmit={(event) => {
      event.preventDefault();
      void run(async () => {
        const auth = await fetch("/api/shortcut-admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }), signal: AbortSignal.timeout(15000) }).then(responseJson);
        setPassword(""); setAdmin(true); setConfigured(true); setStorage(auth.storage); setLoginOpen(false); setPreview(false);
        if (ready && !items.length) change([newShortcut()]);
        setMessage("관리자로 로그인했습니다.");
      });
    }}>
      {!configured && <p>서버에서 8자 이상의 관리자 비밀번호가 확인되지 않았습니다. 환경 변수 설정과 최신 배포를 확인해 주세요.</p>}
      <label>관리자 비밀번호<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
      <button type="submit" disabled={busy}>{busy ? "로그인 확인 중…" : "로그인"}</button>
    </form>}
    {admin && <p className="guide-pending">관리자만 수정할 수 있습니다. ‘저장·공개’를 누르면 모든 방문자에게 반영됩니다. 파일 업로드 후에도 저장 버튼을 눌러 주세요.</p>}
    {admin && !storage && <p role="alert" className="shortcut-error">Vercel Blob 저장소가 연결되지 않았습니다. 연결 후 파일 업로드와 저장을 사용할 수 있습니다.</p>}
    <div role="status" aria-live="polite">{message || (ready ? dirty ? "저장하지 않은 변경이 있습니다." : "" : contentError ? "" : "숏컷 불러오는 중…")}</div>
    {contentError && <div><p role="alert" className="shortcut-error">{contentError}</p><button type="button" disabled={busy} onClick={() => { setContentError(""); setLoadAttempt((attempt) => attempt + 1); }}>숏컷 다시 불러오기</button></div>}
    {error && <p role="alert" className="shortcut-error">{error}</p>}
    <fieldset disabled={!ready || busy} className="shortcut-controls">
      <legend className="shortcut-sr-only">숏컷 편집 도구</legend>
      {admin && <div className="shortcut-toolbar">
        <button type="button" onClick={() => setPreview(!preview)}>{preview ? "편집하기" : "미리보기"}</button>
        <button type="button" className="shortcut-primary" disabled={!storage} onClick={save}>{busy ? "처리 중…" : "저장·공개"}</button>
        <button type="button" onClick={exportBackup}>백업 내보내기</button>
        <label className="shortcut-file-button">백업 불러오기<input type="file" accept=".json,application/json" onChange={(event) => {
          const file = event.target.files?.[0]; event.target.value = "";
          if (!file || (dirty && !window.confirm("작성 중인 내용을 백업 내용으로 바꿀까요?"))) return;
          void run(async () => {
            if (file.size > 2 * 1024 * 1024) throw new Error("백업은 2MB 이하여야 합니다.");
            const data = parseBackup(JSON.parse(await file.text()), slug);
            if (!dirty && !window.confirm("현재 내용을 백업 내용으로 바꿀까요?")) return;
            change(data.shortcuts); setMessage("백업을 불러왔습니다. 저장·공개 버튼을 눌러 반영해 주세요.");
          });
        }} /></label>
      </div>}
      {ready && items.length === 0 && <p className="guide-pending">아직 등록된 숏컷이 없습니다.{admin && " 아래 버튼으로 템플릿을 추가해 주세요."}</p>}
      {items.map((item, index) => <article className="shortcut-template" key={item.id}>
        <div className="shortcut-template-heading"><h2>숏컷 {index + 1}{preview && ` · ${item.title || "제목 미입력"}`}</h2>
          {!preview && <button type="button" onClick={() => { if (window.confirm("이 숏컷과 첨부 자료를 삭제할까요?")) change(items.filter((entry) => entry.id !== item.id)); }}>숏컷 삭제</button>}
        </div>
        {!preview && <label>숏컷 이름<input value={item.title} placeholder="예: 마지막 코너 버섯 숏컷" onChange={(e) => update(item.id, { title: e.target.value })} /></label>}
        {preview ? item.requirements && <p className="shortcut-prose">{item.requirements}</p> : <label>준비 조건 / 사용 아이템<textarea rows={2} value={item.requirements} placeholder="필요한 아이템, 진입 위치, 주의 사항을 적어 주세요." onChange={(e) => update(item.id, { requirements: e.target.value })} /></label>}
        <h3>숏컷 영상</h3>
        {!preview && <>
          <label>영상 URL<input type="url" value={item.video.startsWith("data:") ? "" : item.video} placeholder="YouTube 링크 또는 HTTPS MP4 / WebM 영상 주소" onChange={(e) => update(item.id, { video: e.target.value })} /></label>
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
            <label>단계 설명<textarea rows={5} value={step.text} placeholder="진입 위치 → 드리프트 / 점프 타이밍 → 착지와 복귀 순서로 적어 주세요." onChange={(e) => stepUpdate(item, step.id, { text: e.target.value })} /></label>
            <label>설명 이미지 (PNG / JPEG / WebP / GIF, 최대 10MB)<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => {
              const file = e.target.files?.[0]; e.target.value = "";
              if (file) void run(async () => stepUpdate(item, step.id, { image: await uploadMedia(file, "image") }));
            }} /></label>
            <label>또는 이미지 URL<input type="url" value={step.image.startsWith("data:") ? "" : step.image} placeholder="https://…" onChange={(e) => stepUpdate(item, step.id, { image: e.target.value })} /></label>
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
