"use client";

import Link from "next/link";

export default function PageError({ reset }: { reset: () => void }) {
  return <main className="tracks-page"><section className="tracks-content">
    <h1>페이지 데이터를 불러오지 못했습니다.</h1>
    <p role="alert">연결 상태와 저장소를 확인한 뒤 다시 시도해 주세요.</p>
    <div className="shortcut-toolbar shortcut-workspace">
      <button type="button" onClick={reset}>다시 시도</button>
      <Link href="/">홈으로 →</Link>
    </div>
  </section></main>;
}
