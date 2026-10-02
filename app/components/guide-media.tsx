/* Administrator supplied HTTPS images use the same policy as shortcut images. */
/* eslint-disable @next/next/no-img-element */
import { youtubeEmbed } from "@/lib/shortcut-drafts";
import type { GuideMedia as Media } from "@/lib/guide-content";

export default function GuideMedia({ media, title }: { media: Media; title: string }) {
  const embed = media.video ? youtubeEmbed(media.video) : null;
  return <>
    {media.image && <figure className="guide-media-image"><img src={media.image} alt={media.caption || `${title} 참고 이미지`} loading="lazy" /><figcaption>{media.caption}</figcaption></figure>}
    {embed ? <iframe className="shortcut-video" src={embed} title={`${title} 영상`} allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
      : media.video && <video className="shortcut-video" src={media.video} controls preload="metadata" />}
  </>;
}
