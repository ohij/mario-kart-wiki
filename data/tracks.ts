import catalog from "./track-catalog.json";
import { trackContent } from "./track-content";

export const updateSource = "https://en-americas-support.nintendo.com/app/answers/detail/a_id/68580";

/** The wiki's editorial difficulty scale; not an official Nintendo rating. */
export type Difficulty = 1 | 2 | 3 | 4 | 5;

/** Track categories currently displayed in the wiki. */
export type TrackType = "Circuit" | "Stadium" | "Mountain" | "Off-road" | "City" | "Desert" | "Coastal" | "Forest" | "Industrial" | "Fortress" | "Haunted" | "Volcanic" | "Ice" | "Sky";

export type TrackSection = {
  /** One-based order in which the section appears on the track. */
  number: number;
  name: string;
  description: string;
};

export type Shortcut = {
  id?: string;
  name: string;
  difficulty: Difficulty | null;
  description: string;
};

export type Track = {
  slug: string;
  name: string;
  nameKo?: string;
  aliases?: string[];
  game: string;
  type: TrackType;
  difficulty: Difficulty | null;
  summary: string;
  description: string;
  cups: string[];
  introducedIn: "1.0.0" | "1.8.0";
  parentSlug?: string;
  source: string;
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
    source: string;
  };

  sections: TrackSection[];
  shortcuts: Shortcut[];
  strategies: string[];
  mechanics: string[];
};

const trackGuides: Omit<Track, "cups" | "introducedIn" | "parentSlug" | "source" | "image">[] = [
  {
    slug: "mario-circuit",
    game: "Mario Kart World",
    summary: "A classic circuit-style track.",
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

  {
    slug: "peach-stadium",
    game: "Mario Kart World",
    summary: "A technical course with challenging sections.",
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

  {
    slug: "whistlestop-summit",
    game: "Mario Kart World",
    summary: "A mountain course featuring elevation changes.",
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

  {
    slug: "dandelion-depths",
    game: "Mario Kart World",
    summary: "A course featuring varied terrain and off-road sections.",
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
];

// Preserve existing guides while adding a source-backed page for every course.
export const tracks: Track[] = catalog.map((entry): Track => {
  const content = trackContent[entry.slug];
  if (!content) throw new Error(`Missing track content: ${entry.slug}`);
  const guide = trackGuides.find((track) => track.slug === entry.slug);

  return {
    slug: entry.slug,
    name: entry.name,
    game: "Mario Kart World",
    difficulty: guide?.difficulty ?? null,
    sections: guide?.sections ?? [],
    shortcuts: guide?.shortcuts ?? [],
    strategies: guide?.strategies ?? [],
    mechanics: guide?.mechanics ?? [],
    ...content,
    introducedIn: content.parentSlug ? "1.8.0" : "1.0.0",
    source: entry.source,
    image: {
      src: `/images/tracks/${entry.slug}.webp`,
      alt: `${entry.name} course selection image from Mario Kart World`,
      width: entry.width,
      height: entry.height,
      source: entry.imageSource,
    },
  };
});
