import { notFound } from "next/navigation";
import { tracks } from "@/data/tracks";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function TrackPage({ params }: Props) {
  const { slug } = await params;

  const track = tracks.find((track) => track.slug === slug);

  if (!track) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-12">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <section className="mb-10">
          <p className="text-gray-400 mb-2">
            {track.game}
          </p>

          <h1 className="text-5xl font-bold mb-4">
            {track.name}
          </h1>

          <p className="text-lg text-gray-300">
            {track.description}
          </p>

          <div className="mt-4">
            <span className="text-gray-400 mr-3">
              Difficulty
            </span>

            <span>
              {"★".repeat(track.difficulty)}
              {"☆".repeat(5 - track.difficulty)}
            </span>
          </div>
        </section>

        {/* Sections */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">
            Sections
          </h2>

          <div className="space-y-4">
            {track.sections.map((section, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-800 bg-gray-900 p-5"
              >
                <h3 className="text-xl font-semibold mb-2">
                  {section.name}
                </h3>

                <p className="text-gray-400">
                  {section.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Shortcuts */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">
            Shortcuts
          </h2>

          <div className="space-y-4">
            {track.shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-800 bg-gray-900 p-5"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold">
                    {shortcut.name}
                  </h3>

                  <span>
                    {"★".repeat(shortcut.difficulty)}
                    {"☆".repeat(5 - shortcut.difficulty)}
                  </span>
                </div>

                <p className="text-gray-400">
                  {shortcut.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Strategies */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">
            Strategies
          </h2>

          <ul className="space-y-3">
            {track.strategies.map((strategy, index) => (
              <li
                key={index}
                className="rounded-lg bg-gray-900 border border-gray-800 p-4"
              >
                {strategy}
              </li>
            ))}
          </ul>
        </section>

        {/* Mechanics */}
        <section>
          <h2 className="text-3xl font-bold mb-6">
            Mechanics
          </h2>

          <div className="flex flex-wrap gap-3">
            {track.mechanics.map((mechanic) => (
              <span
                key={mechanic}
                className="rounded-full border border-gray-700 bg-gray-900 px-4 py-2 text-gray-300"
              >
                {mechanic}
              </span>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}