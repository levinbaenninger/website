// The settled parts of the Blog catalog presentation: the lined page heading,
// the Cover frame, and the publication-state row. Server-safe on purpose — the
// catalog prerenders every card before the discovery island hydrates.
//
// Adapted from ncdai/chanhdai.com @ 83e0b842 (MIT, © Chánh Đại).

import Image from "next/image";

import { formatArticleDate } from "@/modules/blog/articles/article-date";
import type { ArticleCover as ArticleCoverImage } from "@/modules/blog/articles/types";
import { Badge } from "@/shared/ui/badge";

export const PageHeading = ({
  tagline,
  title,
}: {
  tagline: string;
  title: string;
}) => (
  <div>
    <div className="px-4 pb-2 font-heading text-sm/none font-medium tracking-wider text-muted-foreground">
      {tagline}
    </div>
    {/* Deviation from the reference, accepted in #32: its h1 has no vertical
        padding, and the title read as cramped between its two guide lines. */}
    <h1 className="screen-line-top screen-line-bottom px-4 py-2 font-heading text-4xl font-medium tracking-tight text-balance">
      {title}
    </h1>
  </div>
);

// Two columns inside the 48 rem rail leave the Cover 22.5 rem at the widest.
const COVER_SIZES = "(min-width: 48rem) 22.5rem, (min-width: 40rem) 45vw, 96vw";

/**
 * The decorative Cover. `alt` is empty because the Article link beside it
 * already carries the title, and the image adds nothing a reader would miss.
 *
 * The frame is always 1200:630 and the source is cropped into it, so a card
 * reserves the same space whatever an author's Cover happens to measure.
 *
 * Grayscale is limited to devices with genuine hover: a coarse pointer can
 * neither hover nor reveal the color, so it gets the colored Cover outright.
 * Reduced motion drops the transition, not the color change.
 */
export const ArticleCover = ({
  cover,
  eager,
}: {
  cover: ArticleCoverImage;
  eager: boolean;
}) => (
  <div className="relative select-none [--image-radius:12px]">
    <Image
      alt=""
      blurDataURL={cover.blurDataURL}
      className="aspect-1200/630 w-full rounded-(--image-radius) object-cover transition-[filter] duration-300 ease-[cubic-bezier(0.42,0,0.58,1)] group-hover:grayscale-0 group-has-[a:focus-visible]:grayscale-0 motion-reduce:transition-none [@media(hover:hover)]:grayscale"
      height={cover.height}
      loading={eager ? "eager" : "lazy"}
      placeholder={cover.blurDataURL === undefined ? "empty" : "blur"}
      sizes={COVER_SIZES}
      src={cover.src}
      width={cover.width}
    />
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-(--image-radius) inset-ring-1 inset-ring-black/15 dark:inset-ring-white/15"
    />
  </div>
);

export const CoverDraftBadge = () => (
  <Badge className="absolute top-2 left-2 shadow-sm">Draft</Badge>
);

export { formatArticleDate } from "@/modules/blog/articles/article-date";

/**
 * The publication state of an Article. A local Draft says so in words rather
 * than showing a date it does not have; a Published Article pairs the visible
 * `dd.MM.yyyy` with the canonical ISO value machines read.
 */
export const PublicationState = ({
  publishedAt,
}: {
  publishedAt: string | null;
}) =>
  publishedAt === null ? (
    <p className="text-sm text-muted-foreground">Not published</p>
  ) : (
    <dl>
      <dt className="sr-only">Published on</dt>
      <dd className="text-sm text-muted-foreground">
        <time dateTime={publishedAt}>{formatArticleDate(publishedAt)}</time>
      </dd>
    </dl>
  );
