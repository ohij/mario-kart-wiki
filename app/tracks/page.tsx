import Link from "next/link";
import { tracks } from "@/data/tracks";

export default function TracksPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-3">
          Tracks
        </h1>

        <p className="text-gray-400 mb-10">
          Explore Mario Kart World tracks, shortcuts, strategies,
          and mechanics.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracks.map((track) => (
            <Link
              key={track.slug}
              href={`/tracks/${track.slug}`}
              className="block"
            >
              <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 hover:border-gray-600 hover:bg-gray-850 transition">
                <h2 className="text-2xl font-semibold mb-2">
                  {track.name}
                </h2>

                <p className="text-sm text-gray-400 mb-4">
                  {track.game}
                </p>

                <p className="text-gray-300 mb-5">
                  {track.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    Difficulty
                  </span>

                  <span>
                    {"★".repeat(track.difficulty)}
                    {"☆".repeat(5 - track.difficulty)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}