import type { MetadataRoute } from "next";
import { publicIndexingEnabled, resolveSiteUrl } from "@/lib/site-metadata";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const base = resolveSiteUrl();
  if (!publicIndexingEnabled()) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] }, sitemap: new URL("/sitemap.xml", base!).href };
}
