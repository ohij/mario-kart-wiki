"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GoogleAdminLogin from "./google-admin-login";
import type { GuideContent, GuideKind } from "@/lib/guide-content";

export default function GuideEditor({ kind, slug, initial }: { kind: GuideKind; slug: string; initial: GuideContent }) {
  const router = useRouter();
  const [content, setContent] = useState(initial);
  const [revision, setRevision] = useState("");
  const [admin, setAdmin] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [storage, setStorage] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const endpoint = `/api/guides/${kind}/${slug}`;

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/api/shortcut-admin", { cache: "no-store", signal: controller.signal }).then((response) => response.json()),
      fetch(endpoint, { cache: "no-store", signal: controller.signal }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; }),
    ]).then(([auth, saved]) => {
      setAdmin(auth.authenticated); setConfigured(auth.configured); setStorage(auth.storage);
      setContent(saved.content); setRevision(saved.revision);
      const authError = new URLSearchParams(window.location.search).get("authError");
      if (authError) { setLoginOpen(true); setError(authError === "forbidden" ? "등록된 관리자 Google 계정이 아닙니다." : "Google 로그인에 실패했습니다. 다시 시도해 주세요."); }
    }).catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "내용을 불러오지 못했습니다."); });
    return () => controller.abort();
  }, [endpoint]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function change(next: GuideContent) { setContent(next); setDirty(true); setMessage(""); }
  async function save() {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json", "If-Match": revision }, body: JSON.stringify(content) });
      const result = await response.json();
      if (response.status === 401) { setAdmin(false); setLoginOpen(true); }
      if (!response.ok) throw new Error(result.error ?? "저장하지 못했습니다.");
      setContent(result.content); setRevision(result.revision); setDirty(false); setEditing(false);
      setMessage("저장했습니다. 방문자에게 공개됩니다."); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "저장하지 못했습니다."); }
    finally { setBusy(false); }
  }
  const isTrack = kind === "tracks";
  const sections = !isTrack && "sections" in content ? content.sections : [];
  const strategies = isTrack && "strategies" in content ? content.strategies : [];
  return <div className="shortcut-workspace guide-editor">
    <div className="shortcut-toolbar">
      {admin ? <>
        <button type="button" onClick={() => setEditing(!editing)} disabled={busy || (editing && dirty)}>{editing ? "편집 닫기" : "관리자 편집"}</button>
        <button type="button" disabled={busy} onClick={async () => { if (dirty && !window.confirm("저장하지 않은 변경이 있습니다. 로그아웃할까요?")) return; await fetch("/api/shortcut-admin", { method: "DELETE" }); window.location.reload(); }}>관리자 로그아웃</button>
      </> : <button type="button" onClick={() => setLoginOpen(!loginOpen)} aria-expanded={loginOpen}>관리자 로그인</button>}
    </div>
    {loginOpen && !admin && <GoogleAdminLogin configured={configured} />}
    {error && <p role="alert" className="shortcut-error">{error}</p>}
    {message && <p role="status">{message}</p>}
    {admin && editing && <div className="shortcut-template">
      <h2>{isTrack ? "트랙별 전략 편집" : "설명 편집"}</h2>
      {!storage && <p role="alert" className="shortcut-error">저장소가 연결되지 않았습니다.</p>}
      {!revision && <p role="alert" className="shortcut-error">최신 내용을 불러오는 중입니다. 저장은 잠시 후 가능합니다.</p>}
      {!isTrack && "sections" in content && <>
        <label>목록 요약<textarea rows={3} value={content.description} onChange={(event) => change({ ...content, description: event.target.value })} /></label>
        {sections.map((section, index) => <div className="shortcut-step" key={index}>
          <label>설명 {index + 1} 제목<input value={section.title} maxLength={200} onChange={(event) => change({ ...content, sections: sections.map((item, i) => i === index ? { ...item, title: event.target.value } : item) })} /></label>
          <label>본문<textarea rows={6} value={section.text} onChange={(event) => change({ ...content, sections: sections.map((item, i) => i === index ? { ...item, text: event.target.value } : item) })} /></label>
          <button type="button" onClick={() => change({ ...content, sections: sections.filter((_, i) => i !== index) })}>이 설명 삭제</button>
        </div>)}
        <button type="button" onClick={() => change({ ...content, sections: [...sections, { title: "", text: "" }] })}>설명 추가</button>
      </>}
      {isTrack && "strategies" in content && <>
        {strategies.map((strategy, index) => <div className="shortcut-step" key={index}>
          <label>전략 {index + 1}<textarea rows={4} value={strategy} onChange={(event) => change({ strategies: strategies.map((item, i) => i === index ? event.target.value : item) })} /></label>
          <button type="button" onClick={() => change({ strategies: strategies.filter((_, i) => i !== index) })}>이 전략 삭제</button>
        </div>)}
        <button type="button" onClick={() => change({ strategies: [...strategies, ""] })}>전략 추가</button>
      </>}
      <div className="shortcut-toolbar"><button className="shortcut-primary" type="button" disabled={busy || !storage || !revision || !dirty} onClick={() => void save()}>{busy ? "저장 중…" : "저장·공개"}</button></div>
    </div>}
  </div>;
}
