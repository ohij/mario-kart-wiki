import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tracks } from "@/data/tracks";
import GuidePage from "@/app/components/guide-page";
import { trackMetadata } from "@/lib/site-metadata";

export function generateStaticParams() { return tracks.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const track = tracks.find((entry) => entry.slug === slug);
  if (!track) notFound();
  return trackMetadata(track, "strategies");
}
export default async function TrackStrategyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const track = tracks.find((entry) => entry.slug === slug);
  if (!track) notFound();
  return <GuidePage title={`${track.name} · 트랙별 전략`} description="이 트랙에 연결된 전략을 확인하세요." backHref="/strategies/tracks" backLabel="트랙별 전략">
    <div className="mechanic-tags"><Link href={`/tracks/${slug}`}>트랙 정보 →</Link><Link href={`/tracks/${slug}/shortcuts`}>이 트랙의 숏컷 →</Link></div>
    <section className="detail-section"><h2>트랙별 전략</h2><div className="strategy-list">
      {!track.strategies.length && <p className="guide-pending">아직 이 트랙의 전략이 작성되지 않았습니다.</p>}
      {track.strategies.map((strategy, index) => <div className="strategy-row" key={index}><span>{String(index + 1).padStart(2, "0")}</span><p>{strategy}</p></div>)}
    </div></section>
  </GuidePage>;
}
