import type { TrackType } from "./tracks";

// Original summaries based on the course articles linked in track-catalog.json.
// SNES availability is checked against Nintendo's Ver. 1.8.0 release notes.
export type TrackContent = {
  nameKo?: string;
  aliases?: string[];
  strategies?: string[];
  mechanics?: string[];
  type: TrackType;
  cups: string[];
  summary: string;
  description: string;
  parentSlug?: string;
};

export const trackContent: Record<string, TrackContent> = {
  "mario-bros-circuit": {
    "type": "Circuit",
    "cups": [
      "Mushroom Cup"
    ],
    "summary": "A desert circuit surrounded by mesas and open roads.",
    "description": "The Mushroom Cup opens in an arid canyon landscape. Mario Bros. Circuit is a separate course from Mario Circuit in the Special Cup."
  },
  "crown-city": {
    "type": "City",
    "cups": [
      "Mushroom Cup",
      "Shell Cup"
    ],
    "summary": "A city course with multiple connected layouts.",
    "description": "Grand Prix visits Crown City in both the Mushroom and Shell Cups. Its route-free race combines the city's layouts into a section-based journey."
  },
  "whistlestop-summit": {
    "type": "Mountain",
    "cups": [
      "Mushroom Cup"
    ],
    "summary": "A railway winds around a mountain shaped like a steam train.",
    "description": "The course climbs through the Wilderness Coast railway setting. An active passenger train circles the mountain beneath its chimney-like summit."
  },
  "dk-spaceport": {
    "type": "Industrial",
    "cups": [
      "Mushroom Cup"
    ],
    "summary": "An ascending course built from zigzagging steel girders.",
    "description": "The Mushroom Cup finale climbs a structure inspired by the original Donkey Kong arcade game. Robo DK waits near the top of the spaceport."
  },
  "desert-hills": {
    "type": "Desert",
    "cups": [
      "Flower Cup"
    ],
    "summary": "A returning desert course with broad dunes and Sarasaland scenery.",
    "description": "The Mario Kart DS course opens the Flower Cup with a redesigned desert landscape. Sand dunes, stone structures and ramps shape its World layout."
  },
  "shy-guy-bazaar": {
    "type": "City",
    "cups": [
      "Flower Cup"
    ],
    "summary": "A bustling bazaar with rooftops, ropes and a palace.",
    "description": "The Mario Kart 7 course returns in the Flower Cup. Daisy's palace overlooks the market, while ropes along the course provide rail-riding routes."
  },
  "wario-stadium": {
    "type": "Stadium",
    "cups": [
      "Flower Cup"
    ],
    "summary": "A dirt stadium rebuilt around jumps and elevated structures.",
    "description": "The Mario Kart 64 course returns with a shortened layout and a rickety stadium setting. A large jump crosses an elevated bridge decorated with Wario's features."
  },
  "airship-fortress": {
    "type": "Fortress",
    "cups": [
      "Flower Cup"
    ],
    "summary": "A fortress and armed airship form the Flower Cup finale.",
    "description": "This returning Mario Kart DS course includes an airship interior, industrial furnaces and a fortress tower. The drawbridge chains can be used for rail riding."
  },
  "dk-pass": {
    "type": "Mountain",
    "cups": [
      "Star Cup"
    ],
    "summary": "A snowy mountain pass redesigned as a ski area.",
    "description": "The Mario Kart DS course opens the Star Cup. Its World version includes snowboarding Shy Guys and a revised downhill route."
  },
  "starview-peak": {
    "type": "Ice",
    "cups": [
      "Star Cup"
    ],
    "summary": "An icy mountain course surrounding an observatory-like building.",
    "description": "This new Star Cup course sits high in the arctic region. Racers follow climbing turns and paths at different heights around its central building."
  },
  "sky-high-sundae": {
    "type": "Sky",
    "cups": [
      "Star Cup"
    ],
    "summary": "An elevated ice-cream course with several rail-riding paths.",
    "description": "The returning Mario Kart 8 Deluxe course appears in the Star Cup. Racing starts inside a giant ice-cream cone, with rails and mesh roads connecting its dessert scenery."
  },
  "wario-shipyard": {
    "type": "Coastal",
    "cups": [
      "Star Cup"
    ],
    "summary": "A haunted shipwreck course raced across the water's surface.",
    "description": "The Mario Kart 7 course closes the Star Cup in a substantially redesigned form. Its World layout replaces underwater driving with surface-water racing."
  },
  "koopa-troopa-beach": {
    "type": "Coastal",
    "cups": [
      "Shell Cup"
    ],
    "summary": "A beach circuit built around the Koopa Festival.",
    "description": "The Shell Cup opens at a seaside course adapted from Super Mario Kart's Koopa Beach 2. A Koopa DJ, speakers and a giant balloon give it a festival setting."
  },
  "faraway-oasis": {
    "type": "Off-road",
    "cups": [
      "Shell Cup"
    ],
    "summary": "A savanna course populated by elephants, zebras and giraffes.",
    "description": "This new Shell Cup course crosses a broad wildlife landscape in the southeast of the world. It is also the destination of the Moon Rally."
  },
  "peach-stadium": {
    "type": "Stadium",
    "cups": [
      "Shell Cup",
      "Special Cup"
    ],
    "summary": "A central stadium with different Grand Prix layouts.",
    "description": "Peach Stadium appears in both the Shell and Special Cups. Route-free VS Race and Time Trials use its Special Cup layout."
  },
  "peach-beach": {
    "type": "Coastal",
    "cups": [
      "Banana Cup"
    ],
    "summary": "A seaside resort course that expands into a castle route.",
    "description": "The returning Double Dash!! course opens the Banana Cup. Its familiar beach is joined by new sections around the Peach Resort Royal Beach Hotel."
  },
  "salty-salty-speedway": {
    "type": "Coastal",
    "cups": [
      "Banana Cup"
    ],
    "summary": "A canal race through Lagoon City.",
    "description": "This new Banana Cup course travels through a waterside town and spends much of the race on canals. It is the only main course where the race starts in boat mode."
  },
  "dino-dino-jungle": {
    "type": "Forest",
    "cups": [
      "Banana Cup"
    ],
    "summary": "A dinosaur-filled jungle with a laboratory section.",
    "description": "The Double Dash!! course returns in the Banana Cup. The redesigned route includes the Dino Dino Laboratory and several dinosaur species that interact with racers."
  },
  "great-block-ruins": {
    "type": "Sky",
    "cups": [
      "Banana Cup"
    ],
    "summary": "Floating ruins built around a giant question-mark block.",
    "description": "The Banana Cup finale takes place high above the southeast of the world. Its central landmark is a massive structure shaped like a ? Block."
  },
  "cheep-cheep-falls": {
    "type": "Forest",
    "cups": [
      "Leaf Cup"
    ],
    "summary": "Rivers and waterfalls wind through an autumn forest.",
    "description": "The Leaf Cup opens in a landscape inspired by historical Japanese architecture. Sections of the route run directly along waterways and waterfalls."
  },
  "dandelion-depths": {
    "type": "Off-road",
    "cups": [
      "Leaf Cup"
    ],
    "summary": "High bridges lead into caves filled with giant dandelions.",
    "description": "This Leaf Cup course combines an abandoned construction setting with underground caverns. Dandelion seeds drift through the course, especially inside the caves."
  },
  "boo-cinema": {
    "type": "Haunted",
    "cups": [
      "Leaf Cup"
    ],
    "summary": "A ghostly cinema opens into a world of film strips.",
    "description": "This Leaf Cup course passes through the theater screen into a sepia-colored movie setting. The surrounding Ghost Valley courses are accessible near the cinema."
  },
  "dry-bones-burnout": {
    "type": "Volcanic",
    "cups": [
      "Leaf Cup"
    ],
    "summary": "Lava, skeletal structures and a graveyard frame this course.",
    "description": "The Leaf Cup finale occupies the volcanic region near Bowser's Castle. Bridges and jumps carry racers around a lava lake."
  },
  "moo-moo-meadows": {
    "type": "Off-road",
    "cups": [
      "Lightning Cup"
    ],
    "summary": "The returning Wii course opens the Lightning Cup.",
    "description": "Moo Moo Meadows is one of the main race courses in Mario Kart World and a stop on several Knockout Tour rallies. A separate battle layout also uses the same location."
  },
  "choco-mountain": {
    "type": "Mountain",
    "cups": [
      "Lightning Cup"
    ],
    "summary": "A returning mountain course rebuilt as a monster-truck arena.",
    "description": "The Mario Kart 64 course appears in the Lightning Cup. Dirt, metal and asphalt roads surround the Chargin' Chuck Monster Trucks facility."
  },
  "toads-factory": {
    "type": "Industrial",
    "cups": [
      "Lightning Cup"
    ],
    "summary": "An industrial course with conveyors and raised rail routes.",
    "description": "The Mario Kart Wii course returns in the Lightning Cup. Its World layout adds upper routes and changes the outdoor water area into off-road mud."
  },
  "bowsers-castle": {
    "type": "Fortress",
    "cups": [
      "Lightning Cup"
    ],
    "summary": "An industrial castle rises above the volcanic region.",
    "description": "The Lightning Cup finale has a high-tech fortress setting. A volcanic structure above the castle sends lava bombs down toward the course."
  },
  "acorn-heights": {
    "type": "Forest",
    "cups": [
      "Special Cup"
    ],
    "summary": "A giant tree supports a village and leaf-lined paths.",
    "description": "The Special Cup opens in the far northern forest. The route travels through treetops and past streams around the tree's roots."
  },
  "mario-circuit": {
    "type": "Circuit",
    "cups": [
      "Special Cup"
    ],
    "summary": "Three Super Mario Kart circuits joined into one race.",
    "description": "The Special Cup version connects Mario Circuits 1, 2 and 3 into a section-based course. Each of those layouts is also individually selectable as a SNES sub-course from Ver. 1.8.0."
  },
  "rainbow-road": {
    "type": "Sky",
    "cups": [
      "Special Cup"
    ],
    "summary": "The Special Cup finale travels from clouds into space.",
    "description": "Rainbow Road passes above Peach Stadium, through a watery blue area and a red space station. It becomes available when the Special Cup is unlocked."
  },
  "snes-mario-circuit-1": {
    "type": "Circuit",
    "cups": [],
    "summary": "The first classic Mario Circuit layout, with green track edging.",
    "description": "This layout forms the first part of World's combined Mario Circuit. It can also be selected as a separate SNES race from Mario Circuit in Ver. 1.8.0.",
    "parentSlug": "mario-circuit"
  },
  "snes-mario-circuit-2": {
    "type": "Circuit",
    "cups": [],
    "summary": "The second classic Mario Circuit layout, with blue track edging.",
    "description": "This layout forms the middle part of World's combined Mario Circuit. Its World version uses a normal jump ramp in place of the gliding ramp seen in Mario Kart 7.",
    "parentSlug": "mario-circuit"
  },
  "snes-mario-circuit-3": {
    "type": "Circuit",
    "cups": [],
    "summary": "The third classic Mario Circuit layout, retaining red track edging.",
    "description": "This layout forms the final part of World's combined Mario Circuit. Ver. 1.8.0 makes it individually selectable from Mario Circuit.",
    "parentSlug": "mario-circuit"
  },
  "snes-ghost-valley-1": {
    "type": "Haunted",
    "cups": [],
    "summary": "A wooden course over a poison lake outside Boo Cinema.",
    "description": "The middle Ghost Valley layout lies directly in front of the cinema. Its World race version includes Swoops as obstacles.",
    "parentSlug": "boo-cinema"
  },
  "snes-ghost-valley-2": {
    "type": "Haunted",
    "cups": [],
    "summary": "A ghostly boardwalk near the western approaches to Boo Cinema.",
    "description": "The course lies near the connections to Dry Bones Burnout and Acorn Heights. Its World layout has sharp corners and a section that dips into the poison lake.",
    "parentSlug": "boo-cinema"
  },
  "snes-ghost-valley-3": {
    "type": "Haunted",
    "cups": [],
    "summary": "The third Ghost Valley layout makes its 3D debut.",
    "description": "This course lies along the connection between Boo Cinema and Starview Peak. Its World version includes a revised wooden layout over a poison lake.",
    "parentSlug": "boo-cinema"
  },
  "snes-choco-island-1": {
    "type": "Off-road",
    "cups": [],
    "summary": "A dirt course near Choco Mountain, adapted from the SNES layout.",
    "description": "The World version widens and simplifies parts of the original layout. Fire Piranha Plants and Ptooies appear during standalone races.",
    "parentSlug": "choco-mountain"
  },
  "snes-choco-island-2": {
    "type": "Off-road",
    "cups": [],
    "summary": "A second classic dirt layout southwest of Choco Mountain.",
    "description": "The World version incorporates the course into connecting routes around Choco Mountain. Ver. 1.8.0 also allows it to be selected as an individual race.",
    "parentSlug": "choco-mountain"
  },
  "snes-koopa-beach-1": {
    "type": "Coastal",
    "cups": [],
    "summary": "A quieter classic beach beside Koopa Troopa Beach.",
    "description": "This SNES layout occupies the southern bay and makes its 3D debut in World. It is a distinct course from the festival-themed Koopa Troopa Beach.",
    "parentSlug": "koopa-troopa-beach"
  },
  "snes-vanilla-lake-1": {
    "type": "Ice",
    "cups": [],
    "summary": "A classic icy course associated with Sky-High Sundae.",
    "description": "The World version reworks the original course with repositioned pipes and additional ramps. Snowballs and penguins appear in standalone races.",
    "parentSlug": "sky-high-sundae"
  }
};
