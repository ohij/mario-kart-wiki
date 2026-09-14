const tracks = [
  {
    slug: "mario-circuit",
    name: "Mario Circuit",
    difficulty: 2,
    type: "Circuit",
    description: "A classic circuit-style track.",
  },
  {
    slug: "peach-stadium",
    name: "Peach Stadium",
    difficulty: 3,
    type: "Stadium",
    description: "A technical course with challenging sections.",
  },
  {
    slug: "whistlestop-summit",
    name: "Whistlestop Summit",
    difficulty: 4,
    type: "Mountain",
    description: "A mountain course featuring elevation changes.",
  },
  {
    slug: "dandelion-depths",
    name: "Dandelion Depths",
    difficulty: 3,
    type: "Off-road",
    description: "A course featuring varied terrain and off-road sections.",
  },
  {
    slug: "example-track-5",
    name: "Example Track 5",
    difficulty: 2,
    type: "Circuit",
    description: "Example track data for the wiki.",
  },
  {
    slug: "example-track-6",
    name: "Example Track 6",
    difficulty: 5,
    type: "Technical",
    description: "A challenging example course.",
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

export default function TracksPage() {
  return (
    <main className="tracks-page">

      <section className="tracks-header">

        <div className="tracks-header-inner">

          <div>
            <span className="section-label">
              MARIO KART WORLD
            </span>

            <h1>🏁 Tracks</h1>

            <p>
              Explore every track, section, shortcut and strategy
              in the Mario Kart Wiki.
            </p>
          </div>

          <div className="track-count">
            <strong>{tracks.length}</strong>
            <span>Tracks</span>
          </div>

        </div>

      </section>


      <section className="tracks-content">

        <div className="track-tools">

          <div className="track-search">
            <span>🔍</span>

            <input
              type="text"
              placeholder="Search tracks..."
            />
          </div>

          <div className="track-filters">

            <button className="filter-active">
              All
            </button>

            <button>
              ★ Easy
            </button>

            <button>
              ★★★ Medium
            </button>

            <button>
              ★★★★★ Hard
            </button>

          </div>

        </div>


        <div className="tracks-list">

          {tracks.map((track) => (

            <a
                href={"/tracks/" + track.slug}
                className="track-list-card"
                key={track.slug}
            >

              <div className="track-list-image">
                <span>MAP</span>
              </div>

              <div className="track-list-info">

                <div className="track-list-top">

                  <span className="track-type">
                    {track.type}
                  </span>

                  <Difficulty level={track.difficulty} />

                </div>

                <h2>{track.name}</h2>

                <p>{track.description}</p>

                <span className="track-open">
                  View track →
                </span>

              </div>

            </a>

          ))}

        </div>

      </section>

    </main>
  );
}
```
