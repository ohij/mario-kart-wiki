import Link from "next/link";
import type { ReactNode } from "react";

export default function GuidePage({ title, description, backHref = "/", backLabel = "Home", children }: {
  title: string; description: string; backHref?: string; backLabel?: string; children: ReactNode;
}) {
  return <main className="track-detail-page">
    <section className="track-detail-hero"><div className="track-detail-inner">
      <Link className="back-link" href={backHref}>← {backLabel}</Link>
      <div className="track-detail-heading"><div>
        <span className="section-label">MARIO KART WORLD WIKI</span>
        <h1>{title}</h1><p>{description}</p>
      </div></div>
    </div></section>
    <section className="track-detail-content">
      <nav className="mechanic-tags guide-navigation" aria-label="Wiki categories">
        <Link href="/tracks">Tracks</Link><Link href="/mechanics">Mechanics</Link><Link href="/strategies/basic">기본 전략</Link><Link href="/strategies/tracks">트랙별 전략</Link><Link href="/shortcuts">트랙별 숏컷</Link><Link href="/controller">컨트롤러 뷰어</Link>
      </nav>
      {children}
    </section>
  </main>;
}
