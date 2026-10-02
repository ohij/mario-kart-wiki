import { tracks } from "./tracks";

export type KnowledgeSection = { title: string; text: string; image?: string; caption?: string; video?: string };
export type KnowledgeTopic = { slug: string; icon: string; name: string; description: string; sections: KnowledgeSection[] };

const featuredMechanics: KnowledgeTopic[] = [
  {
    icon: "💨",
    slug: "drifting",
    name: "Drifting",
    sections: [],
    description: "Learn how to control your kart through corners.",
  },
  {
    icon: "⚡",
    slug: "mini-turbo",
    name: "Mini-Turbo",
    sections: [],
    description: "Build and release boost while drifting.",
  },
  {
    icon: "🪽",
    slug: "jump-action",
    name: "Jump Action",
    sections: [],
    description: "Use jumps and terrain to gain speed.",
  },
];

export const basicStrategies: KnowledgeTopic[] = [
  {
    icon: "🏁",
    slug: "racing-line",
    name: "Racing Line",
    sections: [],
    description: "Find the fastest line through each section.",
  },
  {
    icon: "🛡️",
    slug: "item-defense",
    name: "Item Defense",
    sections: [],
    description: "Learn when and how to protect your position.",
  },
  {
    icon: "⚔️",
    slug: "overtaking",
    name: "Overtaking",
    sections: [],
    description: "Create opportunities to pass opponents.",
  },
];

export const mechanics: KnowledgeTopic[] = [...featuredMechanics];
for (const name of new Set(tracks.flatMap((track) => track.mechanics))) {
  if (!mechanics.some((topic) => topic.name === name)) mechanics.push({
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name, icon: "⚙️", description: "", sections: [],
  });
}

export const findMechanic = (name: string) => mechanics.find((topic) => topic.name === name);
