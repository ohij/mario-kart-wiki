"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { tracks } from "@/data/tracks";

const difficultyFilters = [
  { value: "all", label: "All", min: 1, max: 5 },
  { value: "easy", label: "★ Easy", min: 1, max: 2 },
  { value: "medium", label: "★★★ Medium", min: 3, max: 3 },
  { value: "hard", label: "★★★★★ Hard", min: 4, max: 5 },
] as const;

const views = ["tracks", "shortcuts", "mechanics", "strategies"] as const;

function Difficulty({ level }: { level: number | null }) {
  if (level === null) return <span className="difficulty unrated">Not rated</span>;
  return (
    <span className="difficulty">
      {"★".repeat(level)}
      <span className="empty-stars">{"★".repeat(5 - level)}</span>
    </span>
  );
}

export default function TracksPage() {
  return (
    <Suspense fallback={<main className="tracks-page"><p role="status">Loading tracks…</p></main>}>
      <TrackExplorer />
    </Suspense>
  );
}

function TrackExplorer() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const activeFilter = difficultyFilters.find((filter) => filter.value === searchParams.get("difficulty")) ?? difficultyFilters[0];
  const difficulty = activeFilter.value;
  const view = views.find((value) => value === searchParams.get("view")) ?? "tracks";
  const searchTerms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filteredTracks = tracks.filter((track) => {
    const content = view === "tracks"
      ? [track.summary, track.description, ...track.sections.flatMap((section) => [section.name, section.description]), ...track.shortcuts.flatMap((shortcut) => [shortcut.name, shortcut.description]), ...track.strategies, ...track.mechanics]
      : view === "shortcuts"
        ? track.shortcuts.flatMap((shortcut) => [shortcut.name, shortcut.description])
        : track[view];
    const searchText = [track.name, track.game, track.type, track.introducedIn, ...track.cups, ...content].join(" ").toLowerCase();

    return (
      (view === "tracks" || track[view].length > 0) &&
      searchTerms.every((term) => searchText.includes(term)) &&
      (difficulty === "all" || (track.difficulty !== null &&
        track.difficulty >= activeFilter.min && track.difficulty <= activeFilter.max))
    );
  });
  const hasFilters = query.length > 0 || difficulty !== "all";

  function updateSearch(key: string, value: string, replace = false) {
    const params = new URLSearchParams(window.location.search);
    if (!value || (key === "difficulty" && value === "all") || (key === "view" && value === "tracks")) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const url = params.size ? `/tracks?${params}` : "/tracks";
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  }

  function resetFilters() {
    const params = new URLSearchParams(window.location.search);
    params.delete("q");
    params.delete("difficulty");
    window.history.pushState(null, "", params.size ? `/tracks?${params}` : "/tracks");
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

            <h1>🏁 {view.charAt(0).toUpperCase() + view.slice(1)}</h1>

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

        <div className="track-view-selector">
          <label htmlFor="track-view">Browse</label>
          <select id="track-view" value={view} onChange={(event) => updateSearch("view", event.target.value)}>
            {views.map((value) => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}
          </select>
        </div>

        <div className="track-tools">

          <div className="track-search">
            <span aria-hidden="true">🔍</span>

            <input
              type="search"
              id="track-search"
              aria-label={`Search ${view} by name or content`}
              aria-controls="track-results"
              placeholder="Search tracks..."
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
                title={filter.value === "all" ? "All difficulties" : `${filter.min}–${filter.max} stars`}
                onClick={() => updateSearch("difficulty", filter.value)}
              >
                {filter.label}
              </button>
            ))}

          </div>

        </div>


        <div className="track-results-summary">
          <p>Wiki difficulty ratings; unrated courses appear under All.</p>
          <p role="status" aria-live="polite" aria-atomic="true">
            Showing {filteredTracks.length} of {tracks.length} tracks
          </p>
          {hasFilters && (
            <button type="button" className="track-reset" onClick={resetFilters}>
              Clear filters
            </button>
          )}
        </div>

        <div className="tracks-list" id="track-results">

          {filteredTracks.map((track) => (

            <Link
                href={`/tracks/${track.slug}${view === "tracks" ? "" : view === "shortcuts" ? "/shortcuts" : `#${view}`}`}
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

                <span className="track-edition">{track.parentSlug ? "SNES · Ver. 1.8.0" : track.cups.join(" · ")}</span>

                <p>{track.summary}</p>

                {view === "shortcuts" && (
                  <ul className="track-preview-list">
                    {track.shortcuts.map((shortcut) => <li key={shortcut.name}><strong>{shortcut.name}</strong> · {shortcut.difficulty}/5<p>{shortcut.description}</p></li>)}
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
