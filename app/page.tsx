const tracks = [
  {
    name: "Mario Circuit",
    game: "Mario Kart World",
    difficulty: 2,
    description: "A classic circuit-style track.",
  },
  {
    name: "Peach Stadium",
    game: "Mario Kart World",
    difficulty: 3,
    description: "A technical track with challenging sections.",
  },
  {
    name: "Whistlestop Summit",
    game: "Mario Kart World",
    difficulty: 4,
    description: "A mountain track featuring elevation changes.",
  },
  {
    name: "Dandelion Depths",
    game: "Mario Kart World",
    difficulty: 3,
    description: "An off-road focused course.",
  },
];

const shortcuts = [
  {
    name: "Mario Circuit Shortcut",
    track: "Mario Circuit",
    difficulty: 2,
  },
  {
    name: "Peach Stadium Jump",
    track: "Peach Stadium",
    difficulty: 3,
  },
  {
    name: "Summit Mountain Cut",
    track: "Whistlestop Summit",
    difficulty: 4,
  },
];

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

function Difficulty({ level }: { level: number }) {
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

          <a href="/" className="logo">
            <span className="logo-icon">🏎️</span>
            <span>MARIO KART WIKI</span>
          </a>

          <nav className="nav-links">
            <a href="#tracks">Tracks</a>
            <a href="#shortcuts">Shortcuts</a>
            <a href="#mechanics">Mechanics</a>
            <a href="#strategies">Strategies</a>
          </nav>

          <button className="search-button">
            🔍 Search
          </button>

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

          <div className="search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search the Mario Kart Wiki..."
            />
            <button>Search</button>
          </div>

          <div className="hero-stats">
            <div>
              <strong>4</strong>
              <span>Tracks</span>
            </div>

            <div>
              <strong>3</strong>
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

          <a href="/tracks" className="view-all">
            View all →
          </a>
        </div>


        <div className="card-grid">

          {tracks.map((track) => (
            <article className="track-card" key={track.name}>

              <div className="track-image">
                <span>MAP</span>
              </div>

              <div className="card-content">

                <div className="card-top">
                  <span className="game-tag">
                    Mario Kart World
                  </span>

                  <Difficulty level={track.difficulty} />
                </div>

                <h3>{track.name}</h3>

                <p>{track.description}</p>

                <a href="#" className="card-link">
                  View track →
                </a>

              </div>

            </article>
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

          <a href="#shortcuts" className="view-all">
            View all →
          </a>
        </div>


        <div className="shortcut-grid">

          {shortcuts.map((shortcut) => (
            <article className="shortcut-card" key={shortcut.name}>

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

                  <a href="#">
                    Learn →
                  </a>
                </div>

              </div>

            </article>
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

          <a href="#mechanics" className="view-all">
            View all →
          </a>
        </div>


        <div className="info-grid">

          {mechanics.map((mechanic) => (
            <article className="info-card" key={mechanic.name}>

              <div className="info-icon">
                {mechanic.icon}
              </div>

              <h3>{mechanic.name}</h3>

              <p>{mechanic.description}</p>

              <a href="#">
                Learn more →
              </a>

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

          <a href="#strategies" className="view-all">
            View all →
          </a>
        </div>


        <div className="info-grid">

          {strategies.map((strategy) => (
            <article className="info-card strategy-card" key={strategy.name}>

              <div className="info-icon">
                {strategy.icon}
              </div>

              <h3>{strategy.name}</h3>

              <p>{strategy.description}</p>

              <a href="#">
                Learn more →
              </a>

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