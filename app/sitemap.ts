import type { MetadataRoute } from "next";
import { tracks } from "@/data/tracks";
import { basicStrategies, mechanics } from "@/data/knowledge";
import { resolveSiteUrl, publicIndexingEnabled } from "@/lib/site-metadata";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = resolveSiteUrl();
  if (!publicIndexingEnabled()) return [];
  const pages = ["/", "/tracks", "/shortcuts", "/mechanics", "/strategies", "/strategies/basic", "/strategies/tracks",
    ...tracks.flatMap((track) => [`/tracks/${track.slug}`, `/tracks/${track.slug}/shortcuts`, `/tracks/${track.slug}/strategies`]),
    ...mechanics.map((topic) => `/mechanics/${topic.slug}`),
    ...basicStrategies.map((topic) => `/strategies/basic/${topic.slug}`),
  ];
  // No synthetic lastModified timestamps: static guides have no reliable revision date.
  return pages.map((pathname) => ({ url: new URL(pathname, base!).href }));
}
