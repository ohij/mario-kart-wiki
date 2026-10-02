import Link from "next/link";
import type { Metadata } from "next";
import { mechanics } from "@/data/knowledge";
import GuidePage from "@/app/components/guide-page";
import { pageMetadata } from "@/lib/site-metadata";
import { publishedTopic } from "@/lib/guide-content";

export const metadata: Metadata = pageMetadata("메카닉 · Mechanics", "마리오카트 월드의 드리프트·미니 터보·점프 액션 등 메카닉과 관련 트랙을 확인하세요.", "/mechanics");
export const dynamic = "force-dynamic";
export default async function MechanicsPage() {
  const topics = await Promise.all(mechanics.map((topic) => publishedTopic("mechanics", topic)));
  return <GuidePage title="⚙️ Mechanics" description="메카닉별 설명을 독립된 페이지에서 확인하세요.">
    <div className="info-grid">{topics.map((topic) => <article className="info-card" key={topic.slug}>
      <div className="info-icon">{topic.icon}</div><h2>{topic.name}</h2>
      <p>{topic.description || "상세 설명은 작성 예정입니다."}</p>
      <Link href={`/mechanics/${topic.slug}`}>메카닉 설명 보기 →</Link>
    </article>)}</div>
  </GuidePage>;
}
