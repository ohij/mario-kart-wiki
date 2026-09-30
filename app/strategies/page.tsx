import Link from "next/link";
import type { Metadata } from "next";
import GuidePage from "@/app/components/guide-page";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = pageMetadata("전략 · Strategies", "마리오카트 월드의 기본 전략과 트랙별 전략을 나누어 확인하세요.", "/strategies");
export default function StrategiesPage() {
  return <GuidePage title="🧠 Strategies" description="기본 전략과 특정 트랙에 해당하는 전략을 나누어 확인하세요.">
    <div className="info-grid">
      <article className="info-card strategy-card"><div className="info-icon">🧠</div><h2>기본 전략</h2><p>트랙과 관계없이 참고하는 기본 전략입니다.</p><Link href="/strategies/basic">기본 전략 보기 →</Link></article>
      <article className="info-card strategy-card"><div className="info-icon">🏁</div><h2>트랙별 전략</h2><p>트랙을 선택해 해당 트랙의 전략을 확인하세요.</p><Link href="/strategies/tracks">트랙별 전략 보기 →</Link></article>
    </div>
  </GuidePage>;
}
