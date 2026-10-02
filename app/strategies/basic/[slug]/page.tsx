import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { basicStrategies } from "@/data/knowledge";
import GuidePage from "@/app/components/guide-page";
import { pageMetadata } from "@/lib/site-metadata";
import { publishedTopic } from "@/lib/guide-content";
import GuideEditor from "@/app/components/guide-editor";

export const dynamic = "force-dynamic";
export function generateStaticParams() { return basicStrategies.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const source = basicStrategies.find((entry) => entry.slug === slug);
  const topic = source && await publishedTopic("basic", source);
  if (!topic) notFound();
  return pageMetadata(`${topic.name} · 기본 전략`, `${topic.name} 기본 전략을 확인하세요. ${topic.description}`, `/strategies/basic/${slug}`);
}
export default async function BasicStrategyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const source = basicStrategies.find((entry) => entry.slug === slug);
  const topic = source && await publishedTopic("basic", source);
  if (!topic) notFound();
  return <GuidePage title={`${topic.icon} ${topic.name}`} description={topic.description} backHref="/strategies/basic" backLabel="기본 전략">
    <GuideEditor kind="basic" slug={slug} initial={{ description: topic.description, sections: topic.sections }} />
    <section className="detail-section"><h2>기본 전략 설명</h2>
      {!topic.sections.length && <p className="guide-pending">아직 상세 설명이 작성되지 않았습니다.</p>}
      {topic.sections.map((section, index) => <article key={index}><h3>{section.title}</h3><p className="shortcut-prose">{section.text}</p></article>)}
    </section>
  </GuidePage>;
}
