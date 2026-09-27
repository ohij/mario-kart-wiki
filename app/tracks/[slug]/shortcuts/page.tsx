import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tracks } from "@/data/tracks";
import ShortcutEditor from "./shortcut-editor";

export function generateStaticParams() { return tracks.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const track = tracks.find((entry) => entry.slug === slug);
  return { title: `${track?.name ?? "Track"} · 숏컷 가이드 | Mario Kart World Wiki` };
}

export default async function ShortcutsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const track = tracks.find((entry) => entry.slug === slug);
  if (!track) notFound();
  return (
    <main className="track-detail-page">
      <section className="track-detail-hero"><div className="track-detail-inner">
        <Link className="back-link" href={`/tracks/${slug}#shortcuts`}>← {track.name}</Link>
        <div className="track-detail-heading"><div>
          <span className="section-label">SHORTCUT GUIDE</span>
          <h1>{track.name} · 숏컷</h1>
          <p>숏컷 영상과 단계별 설명, 참고 이미지를 확인하세요.</p>
        </div></div>
      </div></section>
      <section className="track-detail-content">
        <ShortcutEditor key={slug} slug={slug} initial={track.shortcuts} />
      </section>
    </main>
  );
}
