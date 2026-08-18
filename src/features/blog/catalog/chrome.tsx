import Image from "next/image";

import { formatArticleDate } from "@/features/blog/articles/article-date";
import type { ArticleCover as ArticleCoverImage } from "@/features/blog/articles/types";
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
    <h1 className="screen-line-top screen-line-bottom px-4 py-2 font-heading text-4xl font-medium tracking-tight text-balance">
      {title}
    </h1>
  </div>
);

const COVER_SIZES = "(min-width: 48rem) 22.5rem, (min-width: 40rem) 45vw, 96vw";

/** `alt` is empty because the Article link already names the title. Grayscale only on genuine hover: a coarse pointer cannot reveal the color. */
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
      className="aspect-1200/630 w-full rounded-(--image-radius) object-cover transition-[filter] duration-300 ease-in-out group-hover:grayscale-0 group-has-[a:focus-visible]:grayscale-0 motion-reduce:transition-none [@media(hover:hover)]:grayscale"
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
