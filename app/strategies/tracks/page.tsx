import { Suspense } from "react";
import type { Metadata } from "next";
import { tracks } from "@/data/tracks";
import TrackExplorer from "@/app/tracks/track-explorer";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = pageMetadata("트랙별 전략", "40개 트랙에서 전략 가이드를 찾아보고 미작성 트랙과 작성된 공략을 구분해 확인하세요.", "/strategies/tracks");
export const dynamic = "force-dynamic";
export default function TrackStrategiesPage() {
  return <Suspense fallback={<p role="status">트랙 불러오는 중…</p>}>
    <TrackExplorer tracks={tracks} fixedView="strategies" basePath="/strategies/tracks" includePending />
  </Suspense>;
}
