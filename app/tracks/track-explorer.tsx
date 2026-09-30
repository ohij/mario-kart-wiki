"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import type { Track } from "@/data/tracks";

import { difficultyFilters, views, readSearchOptions, filterTracks, matchingShortcuts, hasGuide, updateSearchParams, resetSearchParams } from "@/lib/track-search";

function Difficulty({ level }: { level: number | null }) {
  if (level === null) return <span className="difficulty unrated">Not rated</span>;
  return (
    <span className="difficulty">
      {"★".repeat(level)}
      <span className="empty-stars">{"★".repeat(5 - level)}</span>
    </span>
  );
}

export default function TrackExplorer({ tracks, fixedView, basePath = "/tracks", includePending = false }: {
  tracks: Track[]; fixedView?: "strategies" | "shortcuts"; basePath?: string; includePending?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cups = [...new Set(tracks.flatMap((track) => track.cups))];
  const options = readSearchOptions(searchParams, cups);
  if (fixedView) options.view = fixedView;
  const { query, difficulty, view, cup, course, guide, sort } = options;
  const filteredTracks = filterTracks(tracks, options, includePending);
  const hasFilters = query.length > 0 || difficulty !== "all" || cup !== "all" || course !== "all" || guide !== "all" || sort !== "original";
  const [shareMessage, setShareMessage] = useState("");

  function updateSearch(key: string, value: string, replace = false) {
    const params = updateSearchParams(new URLSearchParams(window.location.search), key, value);
    if (fixedView) params.delete("view");
    const url = params.size ? `${basePath}?${params}` : basePath;
    setShareMessage("");
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  }

  function resetFilters() {
    const params = resetSearchParams(new URLSearchParams(window.location.search));
    setShareMessage("");
    if (fixedView) params.delete("view");
    window.history.pushState(null, "", params.size ? `${basePath}?${params}` : basePath);
  }

  async function shareSearch() {
    try { await navigator.clipboard.writeText(window.location.href); setShareMessage("검색 링크를 복사했습니다."); }
    catch { setShareMessage(`복사하지 못했습니다. 주소창에서 링크를 복사해 주세요: ${window.location.href}`); }
  }
  return (
    <main className="tracks-page">

      <section className="tracks-header">

        <div className="tracks-header-inner">

          <div>
            <Link href="/" className="back-link">← Home</Link>
            <span className="section-label">
              MARIO KART WORLD
            </span>

            <h1>{fixedView === "strategies" ? "🧠 트랙별 전략" : fixedView === "shortcuts" ? "✂️ 트랙별 숏컷" : `🏁 ${view.charAt(0).toUpperCase() + view.slice(1)}`}</h1>

            <p>
              Explore every track, section, shortcut and strategy
              in the Mario Kart Wiki.
            </p>
            <p>{tracks.filter((track) => !track.parentSlug).length} main courses + {tracks.filter((track) => track.parentSlug).length} SNES courses · Ver. 1.8.0</p>
          </div>

          <div className="track-count">
            <strong>{tracks.length}</strong>
            <span>Tracks</span>
          </div>

        </div>

      </section>


      <section className="tracks-content">

        <nav className="mechanic-tags guide-navigation" aria-label="Wiki categories">
          <Link href="/tracks">Tracks</Link><Link href="/mechanics">Mechanics</Link><Link href="/strategies">Strategies</Link><Link href="/shortcuts">Shortcuts</Link>
          {fixedView === "strategies" && <Link href="/strategies/basic">기본 전략 →</Link>}
        </nav>
        {!fixedView && <div className="track-view-selector">
          <label htmlFor="track-view">Browse</label>
          <select id="track-view" value={view} onChange={(event) => {
            const selected = event.target.value;
            const params = new URLSearchParams(window.location.search); params.delete("view");
            const destination = selected === "mechanics" ? "/mechanics" : selected === "strategies" ? "/strategies/tracks" : selected === "shortcuts" ? "/shortcuts" : "/tracks";
            router.push(selected === "mechanics" || !params.size ? destination : `${destination}?${params}`);
          }}>
            {views.map((value) => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}
          </select>
        </div>}

        <div className="track-tools">

          <div className="track-search">
            <span aria-hidden="true">🔍</span>

            <input
              type="search"
              id="track-search"
              aria-label={`Search ${view} by name or content`}
              aria-controls="track-results"
              placeholder="Search names, aliases or content..."
              value={query}
              onChange={(event) => updateSearch("q", event.target.value, true)}
            />
          </div>

          <div className="track-filters" role="group" aria-label="Filter by difficulty">

            {difficultyFilters.map((filter) => (
              <button
                type="button"
                key={filter.value}
                className={difficulty === filter.value ? "filter-active" : undefined}
                aria-pressed={difficulty === filter.value}
                aria-controls="track-results"
                title={filter.value === "all" ? "All difficulties" : filter.value === "unrated" ? "Unrated tracks" : `${filter.min}–${filter.max} stars`}
                onClick={() => updateSearch("difficulty", filter.value)}
              >
                {filter.label}
              </button>
            ))}

          </div>

        </div>


        <div className="track-extra-filters">
          <label htmlFor="track-cup">Cup<select id="track-cup" value={cup} onChange={(event) => updateSearch("cup", event.target.value)} aria-controls="track-results">
            <option value="all">All cups</option>{cups.map((name) => <option key={name} value={name}>{name}</option>)}
          </select></label>
          <label htmlFor="track-course">Course<select id="track-course" value={course} onChange={(event) => updateSearch("course", event.target.value)} aria-controls="track-results">
            <option value="all">All courses</option><option value="main">Main courses</option><option value="snes">SNES sub-courses</option>
          </select></label>
          <label htmlFor="track-guide">Guide<select id="track-guide" value={guide} onChange={(event) => updateSearch("guide", event.target.value)} aria-controls="track-results">
            <option value="all">All guides</option><option value="written">Guide available</option><option value="pending">Guide pending</option>
          </select></label>
          <label htmlFor="track-sort">Sort<select id="track-sort" value={sort} onChange={(event) => updateSearch("sort", event.target.value)} aria-controls="track-results">
            <option value="original">Original order</option><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option>
          </select></label>
        </div>
        <p className="track-filter-note">{fixedView ? "공략 여부는 이 페이지의 전략 또는 숏컷 등록 상태입니다. 미작성 트랙도 선택할 수 있습니다." : "Guide status follows Browse. Tracks counts sections, shortcuts, mechanics or strategies."} SNES sub-courses have no separate Grand Prix cup.</p>
        <div className="track-results-summary">
          <p>Track difficulty ratings; unrated courses appear under All or Not rated.</p>
          <p role="status" aria-live="polite" aria-atomic="true">
            Showing {filteredTracks.length} of {tracks.length} tracks
          </p>
          {hasFilters && (
            <button type="button" className="track-reset" onClick={resetFilters}>
              Clear filters
            </button>
          )}
        </div>

        <div className="track-results-summary"><button type="button" className="track-reset" onClick={shareSearch}>Copy search link</button>{shareMessage && <p role="status">{shareMessage}</p>}</div>

        <div className="tracks-list" id="track-results">

          {filteredTracks.map((track) => (

            <Link
                href={`/tracks/${track.slug}${view === "tracks" ? "" : view === "shortcuts" ? "/shortcuts" : view === "strategies" ? "/strategies" : `#${view}`}`}
                className="track-list-card"
                key={track.slug}
            >

              <div className="track-list-image">
                <Image src={track.image.src} alt={track.image.alt} fill sizes="(max-width: 700px) 100vw, 230px" />
              </div>

              <div className="track-list-info">

                <div className="track-list-top">

                  <span className="track-type">
                    {track.type}
                  </span>

                  <Difficulty level={track.difficulty} />

                </div>

                <h2>{track.name}</h2>
                {track.nameKo && <p>{track.nameKo}</p>}
                <span className="track-guide-status">{hasGuide(track, view) ? "Guide available" : "Guide pending"}{view === "shortcuts" && ` · ${track.shortcuts.length} shortcuts`}</span>

                <span className="track-edition">{track.parentSlug ? "SNES · Ver. 1.8.0" : track.cups.join(" · ")}</span>

                <p>{track.summary}</p>

                {(view === "shortcuts" || view === "tracks" && matchingShortcuts(track, query).length > 0) && (
                  <ul className="track-preview-list">
                    {(view === "shortcuts" ? track.shortcuts : matchingShortcuts(track, query).slice(0, 3)).map((shortcut) => <li key={shortcut.id}><strong>{shortcut.name}</strong> · {shortcut.difficulty === null ? "Not rated" : `${shortcut.difficulty}/5`}<p>{shortcut.description}</p></li>)}
                  </ul>
                )}
                {(view === "mechanics" || view === "strategies") && (
                  <ul className="track-preview-list">
                    {track[view].map((item) => <li key={item}>{item}</li>)}
                  </ul>
                )}

                <span className="track-open">
                  View {view === "tracks" ? "track" : view} →
                </span>

              </div>

            </Link>

          ))}

          {filteredTracks.length === 0 && (
            <div className="tracks-empty">
              <h2>No tracks found</h2>
              <p>Try a different search or clear the filters to see all tracks.</p>
            </div>
          )}

        </div>

      </section>

    </main>
  );
}
