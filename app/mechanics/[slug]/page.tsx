import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mechanics } from "@/data/knowledge";
import { tracks } from "@/data/tracks";
import GuidePage from "@/app/components/guide-page";
import { pageMetadata } from "@/lib/site-metadata";

export function generateStaticParams() { return mechanics.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const topic = mechanics.find((entry) => entry.slug === slug);
  if (!topic) notFound();
  return pageMetadata(`${topic.name} · 메카닉`, `${topic.name} 메카닉 설명과 관련 트랙을 확인하세요. ${topic.description || "상세 설명은 작성 예정입니다."}`, `/mechanics/${slug}`);
}
export default async function MechanicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = mechanics.find((entry) => entry.slug === slug);
  if (!topic) notFound();
  const related = tracks.filter((track) => track.mechanics.includes(topic.name));
  return <GuidePage title={`${topic.icon} ${topic.name}`} description={topic.description} backHref="/mechanics" backLabel="Mechanics">
    <section className="detail-section"><h2>메카닉 설명</h2>
      {!topic.sections.length && <p className="guide-pending">아직 상세 설명이 작성되지 않았습니다.</p>}
      {topic.sections.map((section, index) => <article key={index}><h3>{section.title}</h3><p className="shortcut-prose">{section.text}</p></article>)}
    </section>
    <section className="detail-section"><h2>관련 트랙</h2><div className="mechanic-tags">
      {related.map((track) => <Link href={`/tracks/${track.slug}`} key={track.slug}>{track.name} →</Link>)}
      {!related.length && <p className="guide-pending">연결된 트랙이 없습니다.</p>}
    </div></section>
  </GuidePage>;
}
