"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ContentStatus } from "@/lib/content-status";
import GoogleAdminLogin from "@/app/components/google-admin-login";

const labels = { unreviewed: "아직 조사하지 않음", "no-shortcuts": "숏컷 없음 확인", written: "공개 작성됨", legacy: "기존 가이드 · 공개 저장 전", error: "읽기 실패" };
const needsWork = (row: ContentStatus) => ["unreviewed", "legacy", "error"].includes(row.status) || row.incomplete.length > 0;
const date = (value: string) => new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(value));

async function responseJson(response: Response) {
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "요청에 실패했습니다.");
  return result;
}

export default function ContentDashboard() {
  const [admin, setAdmin] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [storage, setStorage] = useState(true);
  const [busy, setBusy] = useState(true);
  const [rows, setRows] = useState<ContentStatus[] | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function initialize() {
      try {
        const auth = await fetch("/api/shortcut-admin", { cache: "no-store", signal: controller.signal }).then(responseJson);
        if (!active) return;
        setAdmin(auth.authenticated); setConfigured(auth.configured); setStorage(auth.storage);
        const authError = new URLSearchParams(window.location.search).get("authError");
        if (authError) setError(authError === "forbidden" ? "등록된 관리자 Google 계정이 아닙니다." : authError === "cancelled" ? "Google 로그인을 취소했습니다." : "Google 로그인 요청이 만료되었거나 인증에 실패했습니다. 다시 로그인해 주세요.");
        if (auth.authenticated) {
          const response = await fetch("/api/admin/content", { cache: "no-store", signal: controller.signal });
          if (response.status === 401 && active) setAdmin(false);
          const data = await responseJson(response);
          if (active) { setRows(data.tracks); setStorage(data.storage); }
        }
      } catch (reason) { if (active) setError(reason instanceof Error ? reason.message : "현황을 불러오지 못했습니다."); }
      finally { if (active) setBusy(false); }
    }
    const timeout = setTimeout(() => controller.abort(), 30000);
    void initialize().finally(() => clearTimeout(timeout));
    return () => { active = false; controller.abort(); clearTimeout(timeout); };
  }, []);

  async function load() {
    setRows(null);
    const response = await fetch("/api/admin/content", { cache: "no-store", signal: AbortSignal.timeout(30000) });
    if (response.status === 401) setAdmin(false);
    const data = await responseJson(response);
    setRows(data.tracks); setStorage(data.storage);
  }
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(""); setMessage("");
    try { await action(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "작업에 실패했습니다. 다시 시도해 주세요."); }
    finally { setBusy(false); }
  }
  async function research(row: ContentStatus) {
    const response = await fetch(`/api/tracks/${row.slug}/shortcuts`, {
      method: "PUT", headers: { "Content-Type": "application/json", "If-Match": row.revision },
      body: JSON.stringify({ version: 1, track: row.slug, shortcuts: [], researchStatus: row.status === "no-shortcuts" ? "unreviewed" : "no-shortcuts" }),
      signal: AbortSignal.timeout(15000),
    });
    if (response.status === 401) { setAdmin(false); setRows(null); }
    if (response.status === 409) { await load(); throw new Error("다른 탭에서 공개 내용이 변경되었습니다. 최신 현황을 확인한 뒤 다시 시도해 주세요."); }
    await responseJson(response);
    await load();
    setMessage(`${row.name}의 조사 상태를 공개 저장했습니다.`);
  }
  async function backup() {
    const response = await fetch("/api/admin/content?backup=1", { cache: "no-store", signal: AbortSignal.timeout(30000) });
    if (response.status === 401) { setAdmin(false); setRows(null); }
    if (!response.ok) { await responseJson(response); return; }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a"); link.href = url; link.download = `mkw-shortcuts-${new Date().toISOString().slice(0, 10)}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("40개 트랙의 공개 설명과 미디어 주소를 백업했습니다. 원본 미디어 파일은 별도로 보관해 주세요.");
  }

  const visible = (rows ?? []).filter((row) => {
    const text = `${row.name} ${row.nameKo ?? ""} ${row.slug}`.toLowerCase();
    return query.trim().toLowerCase().split(/\s+/).every((word) => text.includes(word)) &&
      (filter === "all" || (filter === "needs-work" ? needsWork(row) : row.status === filter));
  });
  return <div className="shortcut-workspace content-dashboard" aria-busy={busy}>
    {error && <p role="alert" className="shortcut-error">{error}</p>}
    {message && <p role="status">{message}</p>}
    {!admin ? <GoogleAdminLogin configured={configured} disabled={busy} /> : <>
      <div className="shortcut-toolbar">
        <button type="button" disabled={busy} onClick={() => void run(load)}>최신 현황 불러오기</button>
        <button type="button" disabled={busy || !rows || rows.some((row) => row.status === "error")} onClick={() => void run(backup)}>전체 설명 JSON 백업</button>
        <button type="button" disabled={busy} onClick={() => void run(async () => {
          await fetch("/api/shortcut-admin", { method: "DELETE" }).then(responseJson); setAdmin(false); setRows(null);
        })}>관리자 로그아웃</button>
      </div>
      <p>다른 가이드 편집: <Link href="/mechanics">메카닉</Link> · <Link href="/strategies/basic">기본 전략</Link> · <Link href="/strategies/tracks">트랙별 전략</Link>. 각 항목 페이지에서 관리자 로그인 후 내용을 편집할 수 있습니다.</p>
      <p>공개 저장 데이터 기준입니다. 브라우저 초안은 포함하지 않습니다. 기존 가이드는 공개 개수에 포함하지만 저장 완료로 계산하지 않습니다.</p>
      <p>영상·이미지는 공개 필수 조건이 아니며, 빠진 항목은 보완 대상으로 표시합니다. 수정일은 한국 시간이며 과거 저장본은 기록이 없을 수 있습니다.</p>
      {!storage && <p className="shortcut-error">저장소가 연결되지 않았습니다. 로컬 저장 또는 Vercel Blob을 설정해야 조사 상태와 내용을 저장할 수 있습니다.</p>}
      {busy && <p role="status">공개 데이터를 확인하고 있습니다…</p>}
      {rows && <>
        <div className="content-summary" aria-label="전체 콘텐츠 요약">
          <p><strong>{rows.length}</strong>전체 트랙</p>
          <p><strong>{rows.reduce((sum, row) => sum + row.count, 0)}</strong>공개 숏컷</p>
          <p><strong>{rows.filter((row) => row.status === "written").length}</strong>공개 작성됨</p>
          <p><strong>{rows.filter((row) => row.status === "unreviewed").length}</strong>미조사</p>
          <p><strong>{rows.filter((row) => row.status === "no-shortcuts").length}</strong>숏컷 없음 확인</p>
          <p><strong>{rows.filter(needsWork).length}</strong>작성·보완 필요</p>
        </div>
        {rows.some((row) => row.status === "error") && <p role="alert" className="shortcut-error">읽기 실패한 트랙의 개수는 합계에서 제외됩니다. 전체 백업은 모든 트랙을 읽은 후 가능합니다.</p>}
        <div className="content-filters">
          <label>트랙 검색<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="트랙 이름 또는 slug" /></label>
          <label>작성 상태<select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">전체</option><option value="needs-work">작성·보완 필요</option>
            {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
        </div>
        <p role="status">{rows.length}개 중 {visible.length}개 표시</p>
        <div className="content-table-scroll" role="region" aria-label="트랙별 콘텐츠 현황" tabIndex={0}>
          <table className="content-table">
            <caption>40개 트랙 공개 콘텐츠 현황</caption>
            <thead><tr>{["트랙", "공개 숏컷", "작성 여부", "마지막 수정일", "영상", "단계 이미지", "미완성·보완 항목", "관리"].map((title) => <th key={title} scope="col">{title}</th>)}</tr></thead>
            <tbody>{visible.map((row) => <tr key={row.slug}>
              <th scope="row">{row.nameKo ?? row.name}{row.nameKo && <small>{row.name}</small>}</th>
              <td>{row.status === "error" ? "확인 불가" : `${row.count}개`}</td>
              <td>{labels[row.status]}</td>
              <td>{row.status === "error" ? "확인 불가" : row.updatedAt ? <time dateTime={row.updatedAt}>{date(row.updatedAt)}</time> : row.saved ? "기록 없음" : "공개 저장 전"}</td>
              <td>{row.status === "error" ? "확인 불가" : row.count ? `${row.videos}/${row.count}개` : "해당 없음"}</td>
              <td>{row.status === "error" ? "확인 불가" : row.steps ? `${row.images}/${row.steps}단계` : "해당 없음"}</td>
              <td>{row.error ?? (row.status === "unreviewed" ? "조사·작성 필요" : row.status === "legacy" ? ["공개 저장 필요", ...row.incomplete].join(" · ") : row.incomplete.join(" · ") || "—")}</td>
              <td><Link className="shortcut-page-link" href={`/tracks/${row.slug}/shortcuts`}>편집 화면 →</Link>
                {row.status !== "error" && row.count === 0 && <button type="button" disabled={busy || !storage} onClick={() => void run(() => research(row))} aria-label={`${row.name} ${row.status === "no-shortcuts" ? "미조사로 변경" : "숏컷 없음 확인 저장"}`}>{row.status === "no-shortcuts" ? "미조사로 변경" : "숏컷 없음 확인"}</button>}
              </td>
            </tr>)}</tbody>
          </table>
        </div>
        {!visible.length && <p>조건에 맞는 트랙이 없습니다.</p>}
        <p>‘숏컷 없음 확인’은 공개 숏컷이 0개인 트랙을 조사 완료로 저장합니다. 전체 JSON 백업에는 트랙별 설명, 조사 상태, 수정일과 미디어 주소가 포함됩니다. 미디어 원본과 브라우저 초안은 별도로 보관하세요.</p>
      </>}
    </>}
  </div>;
}
