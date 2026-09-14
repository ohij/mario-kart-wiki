export type Track = {
  slug: string;
  name: string;
  game: string;
  difficulty: number;
  description: string;

  sections: {
    name: string;
    description: string;
  }[];

  shortcuts: {
    name: string;
    difficulty: number;
    description: string;
  }[];

  strategies: string[];
  mechanics: string[];
};

export const tracks: Track[] = [
  {
    slug: "mario-circuit",
    name: "Mario Circuit",
    game: "Mario Kart World",
    difficulty: 2,
    description:
      "A classic Mario-themed circuit featuring wide corners and straightforward racing lines.",

    sections: [
      {
        name: "Starting Straight",
        description: "The opening straight leading into the first corner.",
      },
      {
        name: "Main Corner",
        description: "A long corner where maintaining speed is important.",
      },
      {
        name: "Final Section",
        description: "The final section leading back toward the finish line.",
      },
    ],

    shortcuts: [
      {
        name: "Main Corner Shortcut",
        difficulty: 2,
        description: "A shortcut through the inside of the main corner.",
      },
    ],

    strategies: [
      "Maintain high speed through the main corner.",
      "Prepare your drift before entering the final section.",
    ],

    mechanics: [
      "Drifting",
      "Mini-Turbo",
      "Jump Action",
    ],
  },

  {
    slug: "peach-stadium",
    name: "Peach Stadium",
    game: "Mario Kart World",
    difficulty: 3,
    description:
      "A stadium-themed track with multiple technical sections and opportunities for advanced driving.",

    sections: [
      {
        name: "Stadium Entrance",
        description: "The opening section entering the stadium.",
      },
      {
        name: "Technical Section",
        description: "A technical section requiring precise cornering.",
      },
      {
        name: "Final Straight",
        description: "A fast section leading toward the finish.",
      },
    ],

    shortcuts: [
      {
        name: "Stadium Shortcut",
        difficulty: 3,
        description: "A shortcut that can save time when executed correctly.",
      },
    ],

    strategies: [
      "Prioritize clean racing lines.",
      "Save items for the technical section.",
    ],

    mechanics: [
      "Drifting",
      "Mini-Turbo",
      "Item Usage",
    ],
  },
];