import type { Metadata } from "next";
import type { Track } from "../data/tracks";

export const siteName = "Mario Kart World Wiki";
export const siteTitle = `${siteName} | 마리오카트 월드 공략`;
export const siteDescription = "마리오카트 월드 40개 트랙의 정보와 숏컷, 영상·단계별 설명, 메카닉과 기본 전략을 모아 보는 한국어 공략 위키입니다.";

export function resolveSiteUrl(env: NodeJS.ProcessEnv = process.env): URL | undefined {
  const configured = env.SITE_URL?.trim();
  const value = configured || (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined);
  if (!value) return undefined;
  const url = new URL(value);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("SITE_URL은 경로·인증 정보·쿼리가 없는 http(s) 대표 주소로 설정해 주세요.");
  }
  return url;
}

export function publicIndexingEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const url = resolveSiteUrl(env);
  return Boolean(url && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) && env.NODE_ENV === "production" && (!env.VERCEL_ENV || env.VERCEL_ENV === "production"));
}

type ShareImage = { src: string; alt: string; width: number; height: number };
export function pageMetadata(title: string, description: string, pathname: string, image?: ShareImage): Metadata {
  const base = resolveSiteUrl();
  const fullTitle = pathname === "/" ? siteTitle : `${title} | ${siteName}`;
  const url = base ? new URL(pathname, base).href : undefined;
  const representative = image ?? { src: "/share-image", alt: "Mario Kart World Wiki — Tracks, Shortcuts & Strategies", width: 1200, height: 630 };
  const images = base ? [{ url: new URL(representative.src, base).href, alt: representative.alt, width: representative.width, height: representative.height }] : [];
  return {
    title: fullTitle, description,
    ...(base ? { metadataBase: base, alternates: { canonical: url } } : {}),
    openGraph: { type: "website", siteName, locale: "ko_KR", title: fullTitle, description, ...(url ? { url } : {}), images },
    twitter: { card: "summary_large_image", title: fullTitle, description, images },
    robots: { index: publicIndexingEnabled(), follow: true },
  };
}

export function trackDisplayName(track: Track) {
  return track.nameKo ? `${track.nameKo} (${track.name})` : track.name;
}

export function trackMetadata(track: Track, section: "overview" | "shortcuts" | "strategies" = "overview"): Metadata {
  const name = trackDisplayName(track);
  const suffix = section === "overview" ? "" : `/${section}`;
  const title = section === "shortcuts" ? `${name} · 숏컷 가이드` : section === "strategies" ? `${name} · 트랙별 전략` : `${name} · 트랙 정보`;
  const description = section === "shortcuts"
    ? `${name}의 공개 숏컷 가이드와 등록된 영상, 준비 조건, 단계별 설명·이미지를 확인하세요. 미작성 공략은 작성 예정으로 안내합니다.`
    : section === "strategies"
      ? `${name}에 등록된 트랙별 전략과 관련 숏컷·기본 전략을 확인하세요. 미작성 전략은 작성 예정으로 안내합니다.`
      : `${name}의 트랙 정보, 구간·숏컷 공략과 관련 전략·메카닉을 확인하세요. ${track.summary}`;
  return pageMetadata(title, description, `/tracks/${track.slug}${suffix}`, track.image);
}
