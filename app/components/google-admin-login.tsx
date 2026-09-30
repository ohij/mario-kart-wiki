"use client";

import { useState } from "react";

export default function GoogleAdminLogin({ configured, disabled = false }: { configured: boolean; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function login() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/shortcut-admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ returnTo: window.location.pathname }), signal: AbortSignal.timeout(15000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Google 로그인을 시작하지 못했습니다.");
      window.location.assign(data.url);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Google 로그인을 시작하지 못했습니다."); setBusy(false); }
  }
  return <div id="shortcut-login" className="shortcut-login" aria-busy={busy}>
    <h2>관리자 로그인</h2>
    <p>등록된 Google 계정만 관리자로 로그인할 수 있습니다. 해당 계정에 패스키 또는 2단계 인증을 설정해 주세요.</p>
    {!configured && <p role="alert">Google 로그인이 아직 설정되지 않았습니다. 서버의 Google OAuth 설정과 ADMIN_SESSION_SECRET을 확인해 주세요.</p>}
    {error && <p role="alert" className="shortcut-error">{error}</p>}
    <button type="button" disabled={disabled || busy || !configured} onClick={() => void login()}>{busy ? "Google 로그인으로 이동 중…" : "Google 계정으로 관리자 로그인"}</button>
  </div>;
}
