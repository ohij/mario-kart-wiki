import { NextRequest, NextResponse } from "next/server";
import { tracks } from "@/data/tracks";
import { isAdmin, loadShortcuts, storageConfigured } from "@/lib/shortcut-server";
import { initialShortcuts } from "@/lib/shortcut-content";
import { contentStatus, type ContentStatus } from "@/lib/content-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  if (!isAdmin(request)) return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401, headers });
  const records = [];
  for (let index = 0; index < tracks.length; index += 8) {
    records.push(...await Promise.all(tracks.slice(index, index + 8).map(async (track) => {
      try {
        const { data, revision } = await loadShortcuts(track.slug);
        const items = data?.shortcuts ?? initialShortcuts(track);
        return { summary: contentStatus(track, data, items, revision), backup: { slug: track.slug, saved: data !== null, content: data ?? { version: 1, track: track.slug, shortcuts: items } } };
      } catch (error) {
        console.error(`Admin content read failed: ${track.slug}`, error);
        const summary: ContentStatus = { ...contentStatus(track, null, [], ""), status: "error", error: "공개 저장 데이터를 읽지 못했습니다." };
        return { summary, backup: null };
      }
    })));
  }
  if (request.nextUrl.searchParams.get("backup") === "1") {
    if (records.some((record) => record.backup === null)) return NextResponse.json({ error: "읽지 못한 트랙이 있어 전체 백업을 만들지 못했습니다. 현황을 확인하고 다시 시도해 주세요." }, { status: 500, headers });
    return NextResponse.json({ version: 1, exportedAt: new Date().toISOString(), tracks: records.map((record) => record.backup) }, {
      headers: { ...headers, "Content-Disposition": 'attachment; filename="mkw-shortcuts-backup.json"' },
    });
  }
  return NextResponse.json({ tracks: records.map((record) => record.summary), storage: storageConfigured() }, { headers });
}
