import { notFound } from "next/navigation";

const tracks = {
  "mario-circuit": {
    name: "Mario Circuit",
    type: "Circuit",
    difficulty: 2,
    description:
      "A classic circuit-style course featuring straightforward corners and several opportunities for efficient drifting.",

    sections: [
      {
        number: 1,
        name: "Starting Straight",
        description:
          "The opening section leading into the first major corner.",
      },
      {
        number: 2,
        name: "Main Corner",
        description:
          "A technical corner where maintaining a good racing line is important.",
      },
      {
        number: 3,
        name: "Final Section",
        description:
          "The final section before returning to the starting line.",
      },
    ],

    shortcuts: [
      {
        name: "Mario Circuit Shortcut",
        difficulty: 2,
        description:
          "A shortcut that can reduce the distance travelled through the course.",
      },
    ],

    strategies: [
      "Maintain a tight racing line through corners.",
      "Build Mini-Turbo whenever the corner allows it.",
      "Save defensive items when approaching important sections.",
    ],

    mechanics: [
      "Drifting",
      "Mini-Turbo",
      "Jump Action",
    ],
  },

  "peach-stadium": {
    name: "Peach Stadium",
    type: "Stadium",
    difficulty: 3,
    description:
      "A stadium-themed course with technical sections and opportunities for advanced movement.",

    sections: [
      {
        number: 1,
        name: "Stadium Entrance",
        description:
          "The opening section of the course.",
      },
      {
        number: 2,
        name: "Main Stadium",
        description:
          "A technical section requiring careful positioning.",
      },
      {
        number: 3,
        name: "Final Turn",
        description:
          "The final section before the finish.",
      },
    ],

    shortcuts: [
      {
        name: "Peach Stadium Jump",
        difficulty: 3,
        description:
          "A jump-based shortcut requiring precise timing.",
      },
    ],

    strategies: [
      "Prepare your racing line before entering technical corners.",
      "Use jumps efficiently to maintain momentum.",
      "Avoid unnecessary steering corrections.",
    ],

    mechanics: [
      "Drifting",
      "Jump Action",
      "Mini-Turbo",
    ],
  },

  "whistlestop-summit": {
    name: "Whistlestop Summit",
    type: "Mountain",
    difficulty: 4,
    description:
      "A mountain course featuring elevation changes and more demanding sections.",

    sections: [
      {
        number: 1,
        name: "Mountain Approach",
        description:
          "The opening climb toward the main mountain section.",
      },
      {
        number: 2,
        name: "Summit",
        description:
          "A difficult section with significant elevation changes.",
      },
      {
        number: 3,
        name: "Descent",
        description:
          "A downhill section leading toward the finish.",
      },
    ],

    shortcuts: [
      {
        name: "Summit Mountain Cut",
        difficulty: 4,
        description:
          "An advanced shortcut through the mountain section.",
      },
    ],

    strategies: [
      "Plan your racing line around elevation changes.",
      "Avoid losing speed during transitions.",
      "Use advanced movement techniques where appropriate.",
    ],

    mechanics: [
      "Drifting",
      "Jump Action",
      "Mini-Turbo",
    ],
  },

  "dandelion-depths": {
    name: "Dandelion Depths",
    type: "Off-road",
    difficulty: 3,
    description:
      "A varied course featuring off-road terrain and changing track surfaces.",

    sections: [
      {
        number: 1,
        name: "Opening Path",
        description:
          "The opening section of the course.",
      },
      {
        number: 2,
        name: "Depths",
        description:
          "A section featuring more varied terrain.",
      },
      {
        number: 3,
        name: "Final Path",
        description:
          "The final approach toward the finish.",
      },
    ],

    shortcuts: [
      {
        name: "Depths Shortcut",
        difficulty: 3,
        description:
          "A route that cuts through part of the course.",
      },
    ],

    strategies: [
      "Manage your speed carefully on changing surfaces.",
      "Choose the best line before entering off-road sections.",
      "Keep useful items available for difficult sections.",
    ],

    mechanics: [
      "Drifting",
      "Mini-Turbo",
      "Off-road Movement",
    ],
  },
};

function Difficulty({ level }: { level: number }) {
  return (
    <span className="difficulty large">
      {"★".repeat(level)}
      <span className="empty-stars">
        {"★".repeat(5 - level)}
      </span>
    </span>
  );
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const track =
    tracks[slug as keyof typeof tracks];

  if (!track) {
    notFound();
  }

  return (
    <main className="track-detail-page">

      {/* Hero */}

      <section className="track-detail-hero">

        <div className="track-detail-inner">

          <a href="/tracks" className="back-link">
            ← All Tracks
          </a>

          <div className="track-detail-heading">

            <div>

              <span className="section-label">
                MARIO KART WORLD · {track.type.toUpperCase()}
              </span>

              <h1>{track.name}</h1>

              <p>
                {track.description}
              </p>

            </div>

            <div className="detail-difficulty">

              <span>Difficulty</span>

              <Difficulty
                level={track.difficulty}
              />

            </div>

          </div>

        </div>

      </section>


      {/* Main */}

      <section className="track-detail-content">

        <div className="track-map">

          <div className="map-placeholder">
            <span>TRACK MAP</span>
            <small>
              Interactive map coming soon
            </small>
          </div>

        </div>


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
              <strong>Mario Kart World</strong>
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
              <strong>{track.sections.length}</strong>
            </div>

          </div>

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

        <section className="detail-section">

          <div className="detail-title">

            <span className="section-label">
              MASTER THE TRACK
            </span>

            <h2>✂️ Shortcuts</h2>

          </div>

          <div className="detail-shortcuts">

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

                  <a href="#">
                    Learn how to perform it →
                  </a>

                </div>

              </article>

            ))}

          </div>

        </section>


        {/* Strategies */}

        <section className="detail-section">

          <div className="detail-title">

            <span className="section-label">
              RACE BETTER
            </span>

            <h2>🧠 Strategies</h2>

          </div>

          <div className="strategy-list">

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

        <section className="detail-section">

          <div className="detail-title">

            <span className="section-label">
              RELATED KNOWLEDGE
            </span>

            <h2>⚙️ Mechanics</h2>

          </div>

          <div className="mechanic-tags">

            {track.mechanics.map((mechanic) => (

              <a href="#" key={mechanic}>
                ⚙️ {mechanic}
              </a>

            ))}

          </div>

        </section>

      </section>

    </main>
  );
}
