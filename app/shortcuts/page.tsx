import { Suspense } from "react";
import type { Metadata } from "next";
import { tracks } from "@/data/tracks";
import { loadPublishedTracks } from "@/lib/shortcut-server";
import TrackExplorer from "@/app/tracks/track-explorer";
import { pageMetadata } from "@/lib/site-metadata";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata("트랙별 숏컷", "40개 트랙의 공개 숏컷 가이드를 검색하고 트랙별 영상·단계별 설명을 찾아보세요.", "/shortcuts");
export default async function ShortcutsPage() {
  const published = await loadPublishedTracks(tracks);
  return <Suspense fallback={<p role="status">숏컷 불러오는 중…</p>}>
    <TrackExplorer tracks={published} fixedView="shortcuts" basePath="/shortcuts" includePending />
  </Suspense>;
}
