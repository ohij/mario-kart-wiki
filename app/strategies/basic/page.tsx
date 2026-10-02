import Link from "next/link";
import type { Metadata } from "next";
import { basicStrategies } from "@/data/knowledge";
import GuidePage from "@/app/components/guide-page";
import { pageMetadata } from "@/lib/site-metadata";
import { publishedTopic } from "@/lib/guide-content";

export const metadata: Metadata = pageMetadata("기본 전략", "마리오카트 월드에서 트랙 공통으로 참고할 주행 라인·아이템 방어·추월 전략을 확인하세요.", "/strategies/basic");
export const dynamic = "force-dynamic";
export default async function BasicStrategiesPage() {
  const topics = await Promise.all(basicStrategies.map((topic) => publishedTopic("basic", topic)));
  return <GuidePage title="🧠 기본 전략" description="트랙 공통으로 참고할 전략을 항목별로 확인하세요." backHref="/strategies" backLabel="Strategies">
    <div className="info-grid">{topics.map((topic) => <article className="info-card strategy-card" key={topic.slug}>
      <div className="info-icon">{topic.icon}</div><h2>{topic.name}</h2><p>{topic.description}</p>
      <Link href={`/strategies/basic/${topic.slug}`}>기본 전략 설명 보기 →</Link>
    </article>)}</div>
  </GuidePage>;
}
