import { Suspense } from "react";
import { tracks } from "@/data/tracks";
import { loadPublishedTracks } from "@/lib/shortcut-server";
import TrackExplorer from "./track-explorer";
import { pageMetadata } from "@/lib/site-metadata";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata("트랙 목록", "마리오카트 월드 40개 트랙을 검색하고 컵·난이도·공략 작성 여부로 찾아보세요.", "/tracks");

export default async function TracksPage() {
  const published = await loadPublishedTracks(tracks);
  return (
    <Suspense fallback={<main className="tracks-page"><p role="status">Loading tracks…</p></main>}>
      <TrackExplorer tracks={published} />
    </Suspense>
  );
}
