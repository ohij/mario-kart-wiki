import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { tracks, updateSource } from "@/data/tracks";

function Difficulty({ level }: { level: number | null }) {
  if (level === null) return <span className="difficulty unrated">Not rated</span>;
  return (
    <span className="difficulty large">
      {"★".repeat(level)}
      <span className="empty-stars">
        {"★".repeat(5 - level)}
      </span>
    </span>
  );
}

export function generateStaticParams() {
  return tracks.map((track) => ({ slug: track.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const track = tracks.find((track) => track.slug === slug);
  return track ? { title: `${track.name} | Mario Kart World Wiki`, description: track.summary } : { title: "Track not found" };
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const track = tracks.find((track) => track.slug === slug);

  if (!track) {
    notFound();
  }
  const parent = tracks.find((entry) => entry.slug === track.parentSlug);
  const subCourses = tracks.filter((entry) => entry.parentSlug === track.slug);

  return (
    <main className="track-detail-page">

      {/* Hero */}

      <section className="track-detail-hero">

        <div className="track-detail-inner">

          <Link href="/tracks" className="back-link">
            ← All Tracks
          </Link>

          <div className="track-detail-heading">

            <div>

              <span className="section-label">
                {track.game.toUpperCase()} · {track.type.toUpperCase()}
              </span>

              <h1>{track.name}</h1>

              <p>
                {track.description}
              </p>

            </div>

            <div className="detail-difficulty">

              <span>Wiki difficulty</span>

              <Difficulty
                level={track.difficulty}
              />

            </div>

          </div>

        </div>

      </section>


      {/* Main */}

      <section className="track-detail-content">

        <figure className="track-map">
          <Image className="track-detail-image" src={track.image.src} alt={track.image.alt} width={track.image.width} height={track.image.height} sizes="(max-width: 1152px) 100vw, 1104px" loading="eager" />
          <figcaption className="image-credit">
            Course selection image · © Nintendo · <a href={track.image.source} target="_blank" rel="noreferrer">Image source: Super Mario Wiki</a>
          </figcaption>
        </figure>


        {/* Basic Information */}

        <section className="detail-section">

          <div className="detail-title">

            <span className="section-label">
              OVERVIEW
            </span>

            <h2>Track Information</h2>

          </div>

          <div className="detail-info-grid">

            <div>
              <span>Game</span>
              <strong>{track.game}</strong>
            </div>

            <div>
              <span>Type</span>
              <strong>{track.type}</strong>
            </div>

            <div>
              <span>Difficulty</span>
              <strong>
                <Difficulty level={track.difficulty} />
              </strong>
            </div>

            <div>
              <span>Sections</span>
              <strong>{track.sections.length ? `${track.sections.length} in this guide` : "Guide pending"}</strong>
            </div>

            <div>
              <span>Available since</span>
              <strong>{track.introducedIn === "1.8.0" ? "Ver. 1.8.0" : "Launch"}</strong>
            </div>
            <div>
              <span>{parent ? "Select from" : "Grand Prix"}</span>
              <strong>{parent ? <Link href={`/tracks/${parent.slug}`}>{parent.name} →</Link> : track.cups.join(" / ")}</strong>
            </div>

          </div>

          {parent && <p className="track-source-note">Available in VS Race, Time Trials, Online Play and Wireless Play from Ver. 1.8.0. This SNES sub-course uses item panels and is not a separate Grand Prix race. <a href={updateSource} target="_blank" rel="noreferrer">Nintendo update notes →</a></p>}
          <p className="track-source-note">Course reference: <a href={track.source} target="_blank" rel="noreferrer">{track.name} on Super Mario Wiki →</a></p>

          {subCourses.length > 0 && (
            <div className="related-courses">
              <h3>SNES courses · Ver. 1.8.0</h3>
              {subCourses.map((entry) => <Link key={entry.slug} href={`/tracks/${entry.slug}`}>{entry.name} →</Link>)}
            </div>
          )}

        </section>


        {/* Sections */}

        <section className="detail-section">

          <div className="detail-title">

            <span className="section-label">
              TRACK LAYOUT
            </span>

            <h2>Sections</h2>

          </div>

          <div className="sections-list">
            {track.sections.length === 0 && <p className="guide-pending">A section-by-section guide has not been added yet.</p>}

            {track.sections.map((section) => (

              <article
                className="section-card"
                key={section.number}
              >

                <div className="section-number">
                  {String(section.number).padStart(2, "0")}
                </div>

                <div>
                  <h3>{section.name}</h3>

                  <p>
                    {section.description}
                  </p>
                </div>

              </article>

            ))}

          </div>

        </section>


        {/* Shortcuts */}

        <section id="shortcuts" className="detail-section">

          <div className="detail-title">

            <span className="section-label">
              MASTER THE TRACK
            </span>

            <h2>✂️ Shortcuts</h2>

            <Link className="shortcut-page-link" href={`/tracks/${track.slug}/shortcuts`}>
              숏컷 영상·방법 보기 / 직접 작성 →
            </Link>

          </div>

          <div className="detail-shortcuts">
            {track.shortcuts.length === 0 && <p className="guide-pending">No shortcut guide has been added yet.</p>}

            {track.shortcuts.map((shortcut) => (

              <article
                className="detail-shortcut-card"
                key={shortcut.name}
              >

                <div className="shortcut-icon">
                  ✂️
                </div>

                <div>

                  <div className="shortcut-card-top">
                    <span>SHORTCUT</span>

                    <Difficulty
                      level={shortcut.difficulty}
                    />
                  </div>

                  <h3>{shortcut.name}</h3>

                  <p>{shortcut.description}</p>

                  <a href="#strategies">
                    View track strategies →
                  </a>

                </div>

              </article>

            ))}

          </div>

        </section>


        {/* Strategies */}

        <section id="strategies" className="detail-section">

          <div className="detail-title">

            <span className="section-label">
              RACE BETTER
            </span>

            <h2>🧠 Strategies</h2>

          </div>

          <div className="strategy-list">
            {track.strategies.length === 0 && <p className="guide-pending">Track-specific strategies have not been added yet.</p>}

            {track.strategies.map(
              (strategy, index) => (

                <div
                  className="strategy-row"
                  key={strategy}
                >

                  <span>
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <p>{strategy}</p>

                </div>

              )
            )}

          </div>

        </section>


        {/* Mechanics */}

        <section id="mechanics" className="detail-section">

          <div className="detail-title">

            <span className="section-label">
              RELATED KNOWLEDGE
            </span>

            <h2>⚙️ Mechanics</h2>

          </div>

          <div className="mechanic-tags">
            {track.mechanics.length === 0 && <p className="guide-pending">Related techniques have not been documented yet.</p>}

            {track.mechanics.map((mechanic) => (

              <Link href={`/tracks?view=mechanics&q=${encodeURIComponent(mechanic)}`} key={mechanic} title={`Find tracks using ${mechanic}`}>
                ⚙️ {mechanic}
              </Link>

            ))}

          </div>

        </section>

      </section>

    </main>
  );
}
