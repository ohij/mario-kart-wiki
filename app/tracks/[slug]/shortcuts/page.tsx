import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tracks } from "@/data/tracks";
import { loadShortcuts } from "@/lib/shortcut-server";
import { initialShortcuts } from "@/lib/shortcut-content";
import type { ShortcutDraft } from "@/lib/shortcut-drafts";
import ShortcutEditor from "./shortcut-editor";
import { trackMetadata } from "@/lib/site-metadata";

export const dynamic = "force-dynamic";

export function generateStaticParams() { return tracks.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const track = tracks.find((entry) => entry.slug === slug);
  if (!track) notFound();
  return trackMetadata(track, "shortcuts");
}

export default async function ShortcutsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const track = tracks.find((entry) => entry.slug === slug);
  if (!track) notFound();
  let initial: ShortcutDraft[] = [];
  let initialError = "";
  try {
    const saved = await loadShortcuts(slug);
    initial = saved.data?.shortcuts ?? initialShortcuts(track);
  } catch (error) {
    console.error(`Shortcut read failed: ${slug}`, error);
    initialError = "숏컷을 불러오지 못했습니다. 다시 불러오기를 눌러 주세요. 관리자 로그인은 사용할 수 있습니다.";
  }
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
        <nav className="mechanic-tags guide-navigation" aria-label="Related guides">
          <Link href="/shortcuts">트랙별 숏컷 목록</Link><Link href={`/tracks/${slug}/strategies`}>이 트랙의 전략</Link><Link href="/mechanics">Mechanics</Link>
        </nav>
        <ShortcutEditor key={slug} slug={slug} initial={initial} initialError={initialError} />
      </section>
    </main>
  );
}
