import type { Track } from "../data/tracks";

export const views = ["tracks", "shortcuts", "mechanics", "strategies"] as const;
export const difficultyFilters = [
  { value: "all", label: "All", min: 1, max: 5 },
  { value: "easy", label: "★ Easy", min: 1, max: 2 },
  { value: "medium", label: "★★★ Medium", min: 3, max: 3 },
  { value: "hard", label: "★★★★★ Hard", min: 4, max: 5 },
  { value: "unrated", label: "Not rated", min: 0, max: 0 },
] as const;
export type SearchOptions = {
  query: string; view: typeof views[number]; difficulty: typeof difficultyFilters[number]["value"];
  cup: string; course: "all" | "main" | "snes"; guide: "all" | "written" | "pending"; sort: "original" | "name-asc" | "name-desc";
};
export const filterKeys = ["q", "difficulty", "cup", "course", "guide", "sort"] as const;
export const normalizeSearch = (value: string) => value.normalize("NFKC").toLocaleLowerCase("en");
export const searchTerms = (query: string) => normalizeSearch(query).trim().split(/\s+/).filter(Boolean);

export function readSearchOptions(params: Pick<URLSearchParams, "get">, cups: string[]): SearchOptions {
  const pick = <T extends string>(key: string, choices: readonly T[], fallback: T): T => choices.find((value) => value === params.get(key)) ?? fallback;
  return {
    query: params.get("q") ?? "", view: pick("view", views, "tracks"),
    difficulty: pick("difficulty", difficultyFilters.map(({ value }) => value), "all"),
    cup: cups.includes(params.get("cup") ?? "") ? params.get("cup")! : "all",
    course: pick("course", ["all", "main", "snes"], "all"),
    guide: pick("guide", ["all", "written", "pending"], "all"),
    sort: pick("sort", ["original", "name-asc", "name-desc"], "original"),
  };
}

export function hasGuide(track: Track, view: SearchOptions["view"]): boolean {
  return view === "tracks" ? [track.sections, track.shortcuts, track.mechanics, track.strategies].some((items) => items.length > 0) : track[view].length > 0;
}

export function matchingShortcuts(track: Track, query: string) {
  const terms = searchTerms(query);
  return terms.length ? track.shortcuts.filter((item) => {
    const text = normalizeSearch(`${item.name} ${item.description}`);
    return terms.some((term) => text.includes(term));
  }) : [];
}

export function filterTracks(tracks: Track[], options: SearchOptions, includePending = false): Track[] {
  const terms = searchTerms(options.query);
  const range = difficultyFilters.find(({ value }) => value === options.difficulty)!;
  const filtered = tracks.filter((track) => {
    const guide = hasGuide(track, options.view);
    // Pending guides must remain discoverable even in a content-specific view.
    if (options.guide === "pending" ? guide : (options.guide === "written" || !includePending && options.view !== "tracks") && !guide) return false;
    if (options.course === "main" && track.parentSlug || options.course === "snes" && !track.parentSlug) return false;
    if (options.cup !== "all" && !track.cups.includes(options.cup)) return false;
    if (options.difficulty === "unrated" ? track.difficulty !== null : options.difficulty !== "all" && (track.difficulty === null || track.difficulty < range.min || track.difficulty > range.max)) return false;
    const content = options.view === "tracks"
      ? [track.summary, track.description, ...track.sections.flatMap((section) => [section.name, section.description]), ...track.shortcuts.flatMap((item) => [item.name, item.description]), ...track.strategies, ...track.mechanics]
      : options.view === "shortcuts" ? track.shortcuts.flatMap((item) => [item.name, item.description]) : track[options.view];
    const text = normalizeSearch([track.name, track.nameKo, ...(track.aliases ?? []), track.slug, track.game, track.type, track.introducedIn, ...track.cups, ...content].join(" "));
    return terms.every((term) => text.includes(term));
  });
  if (options.sort !== "original") {
    filtered.sort((a, b) => (options.sort === "name-desc" ? -1 : 1) * a.name.localeCompare(b.name, "en", { numeric: true, sensitivity: "base" }));
  }
  return filtered;
}

export function updateSearchParams(params: URLSearchParams, key: string, value: string) {
  const next = new URLSearchParams(params);
  if (!value || ["difficulty", "cup", "course", "guide"].includes(key) && value === "all" || key === "view" && value === "tracks" || key === "sort" && value === "original") next.delete(key);
  else next.set(key, value);
  return next;
}
export function resetSearchParams(params: URLSearchParams) {
  const next = new URLSearchParams(params);
  filterKeys.forEach((key) => next.delete(key));
  return next;
}
