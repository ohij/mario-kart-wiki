import Link from "next/link";
import Image from "next/image";
import { tracks } from "@/data/tracks";

const featuredTracks = ["mario-circuit", "peach-stadium", "whistlestop-summit", "dandelion-depths"]
  .flatMap((slug) => tracks.filter((track) => track.slug === slug));

const shortcuts = tracks.flatMap((track) =>
  track.shortcuts.map((shortcut) => ({
    ...shortcut,
    track: track.name,
    trackSlug: track.slug,
  }))
);

const mechanics = [
  {
    icon: "💨",
    name: "Drifting",
    description: "Learn how to control your kart through corners.",
  },
  {
    icon: "⚡",
    name: "Mini-Turbo",
    description: "Build and release boost while drifting.",
  },
  {
    icon: "🪽",
    name: "Jump Action",
    description: "Use jumps and terrain to gain speed.",
  },
];

const strategies = [
  {
    icon: "🏁",
    name: "Racing Line",
    description: "Find the fastest line through each section.",
  },
  {
    icon: "🛡️",
    name: "Item Defense",
    description: "Learn when and how to protect your position.",
  },
  {
    icon: "⚔️",
    name: "Overtaking",
    description: "Create opportunities to pass opponents.",
  },
];

function Difficulty({ level }: { level: number | null }) {
  if (level === null) return <span className="difficulty unrated">Not rated</span>;
  return (
    <span className="difficulty">
      {"★".repeat(level)}
      <span className="empty-stars">{"★".repeat(5 - level)}</span>
    </span>
  );
}

export default function Home() {
  return (
    <main className="site">

      {/* Navigation */}
      <header className="navbar">
        <div className="nav-inner">

          <Link href="/" className="logo">
            <span className="logo-icon">🏎️</span>
            <span>MARIO KART WIKI</span>
          </Link>

          <nav className="nav-links">
            <a href="#tracks">Tracks</a>
            <a href="#shortcuts">Shortcuts</a>
            <a href="#mechanics">Mechanics</a>
            <a href="#strategies">Strategies</a>
          </nav>

          <Link href="/tracks#track-search" className="search-button">
            🔍 Search
          </Link>

        </div>
      </header>


      {/* Hero */}
      <section className="hero">

        <div className="hero-content">

          <div className="hero-badge">
            MARIO KART WORLD
          </div>

          <h1>
            The Mario Kart
            <span> Wiki</span>
          </h1>

          <p className="hero-description">
            Your community encyclopedia for tracks,
            shortcuts, mechanics and racing strategies.
          </p>

          <form action="/tracks" method="get" role="search" className="search-box">
            <span aria-hidden="true">🔍</span>
            <input
              type="search"
              name="q"
              aria-label="Search tracks and related content"
              placeholder="Search the Mario Kart Wiki..."
            />
            <button type="submit">Search</button>
          </form>

          <div className="hero-stats">
            <div>
              <strong>{tracks.length}</strong>
              <span>Tracks</span>
            </div>

            <div>
              <strong>{shortcuts.length}</strong>
              <span>Shortcuts</span>
            </div>

            <div>
              <strong>3</strong>
              <span>Mechanics</span>
            </div>

            <div>
              <strong>3</strong>
              <span>Strategies</span>
            </div>
          </div>

        </div>

      </section>


      {/* Tracks */}
      <section id="tracks" className="content-section">

        <div className="section-heading">
          <div>
            <span className="section-label">EXPLORE</span>
            <h2>🏁 Tracks</h2>
            <p>
              Explore tracks, sections, shortcuts and racing lines.
            </p>
          </div>

          <Link href="/tracks" className="view-all">
            View all →
          </Link>
        </div>


        <div className="card-grid">

          {featuredTracks.map((track) => (
            <Link
              href={"/tracks/" + track.slug}
              className="track-card"
              key={track.slug}
              aria-label={`View track: ${track.name}`}
            >

              <div className="track-image">
                <Image src={track.image.src} alt={track.image.alt} fill sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 25vw" />
              </div>

              <div className="card-content">

                <div className="card-top">
                  <span className="game-tag">
                    {track.game}
                  </span>

                  <Difficulty level={track.difficulty} />
                </div>

                <h3>{track.name}</h3>

                <p>{track.summary}</p>

                <span className="card-link">
                  View track →
                </span>

              </div>

            </Link>
          ))}

        </div>

      </section>


      {/* Shortcuts */}
      <section id="shortcuts" className="content-section alternate">

        <div className="section-heading">
          <div>
            <span className="section-label">MASTER THE TRACK</span>
            <h2>✂️ Shortcuts</h2>
            <p>
              Discover shortcuts and learn exactly how to perform them.
            </p>
          </div>

          <Link href="/tracks?view=shortcuts" className="view-all">
            View all →
          </Link>
        </div>


        <div className="shortcut-grid">

          {shortcuts.slice(0, 3).map((shortcut) => (
            <Link
              href={`/tracks/${shortcut.trackSlug}/shortcuts`}
              className="shortcut-card"
              key={`${shortcut.trackSlug}-${shortcut.name}`}
              aria-label={`Learn shortcut: ${shortcut.name}`}
            >

              <div className="shortcut-number">
                ✂️
              </div>

              <div className="shortcut-info">

                <span className="small-tag">
                  {shortcut.track}
                </span>

                <h3>{shortcut.name}</h3>

                <div className="shortcut-bottom">
                  <Difficulty level={shortcut.difficulty} />

                  <span className="shortcut-link">
                    Learn →
                  </span>
                </div>

              </div>

            </Link>
          ))}

        </div>

      </section>


      {/* Mechanics */}
      <section id="mechanics" className="content-section">

        <div className="section-heading">
          <div>
            <span className="section-label">LEARN</span>
            <h2>⚙️ Mechanics</h2>
            <p>
              Understand the mechanics behind fast Mario Kart racing.
            </p>
          </div>

          <Link href="/tracks?view=mechanics" className="view-all">
            View all →
          </Link>
        </div>


        <div className="info-grid">

          {mechanics.map((mechanic) => (
            <article className="info-card" key={mechanic.name}>

              <div className="info-icon">
                {mechanic.icon}
              </div>

              <h3>{mechanic.name}</h3>

              <p>{mechanic.description}</p>

              <Link href={`/tracks?view=mechanics&q=${encodeURIComponent(mechanic.name)}`}>
                Find related tracks →
              </Link>

            </article>
          ))}

        </div>

      </section>


      {/* Strategies */}
      <section id="strategies" className="content-section alternate">

        <div className="section-heading">
          <div>
            <span className="section-label">RACE BETTER</span>
            <h2>🧠 Strategies</h2>
            <p>
              Improve your racing decisions and consistency.
            </p>
          </div>

          <Link href="/tracks?view=strategies" className="view-all">
            View all →
          </Link>
        </div>


        <div className="info-grid">

          {strategies.map((strategy) => (
            <article className="info-card strategy-card" key={strategy.name}>

              <div className="info-icon">
                {strategy.icon}
              </div>

              <h3>{strategy.name}</h3>

              <p>{strategy.description}</p>

              <Link href="/tracks?view=strategies">
                Browse track strategies →
              </Link>

            </article>
          ))}

        </div>

      </section>


      {/* CTA */}
      <section className="cta">

        <div>
          <span className="section-label">MARIO KART WIKI</span>

          <h2>
            Learn the track.
            <br />
            Master the race.
          </h2>

          <p>
            Everything you need to become a faster Mario Kart racer.
          </p>
        </div>

        <a href="#tracks" className="cta-button">
          Explore the Wiki →
        </a>

      </section>


      {/* Footer */}
      <footer className="footer">

        <div className="footer-inner">

          <div className="footer-brand">
            <strong>🏎️ MARIO KART WIKI</strong>
            <p>
              A community-driven Mario Kart knowledge base.
            </p>
          </div>

          <div className="footer-links">
            <a href="#tracks">Tracks</a>
            <a href="#shortcuts">Shortcuts</a>
            <a href="#mechanics">Mechanics</a>
            <a href="#strategies">Strategies</a>
          </div>

        </div>

        <div className="copyright">
          Mario Kart Wiki — Community Project
        </div>

      </footer>

    </main>
  );
}
