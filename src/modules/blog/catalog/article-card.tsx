import Link from "next/link";

import type { ArticleSummary } from "@/modules/blog/articles/types";

import { ArticleCover, CoverDraftBadge, PublicationState } from "./chrome";

/**
 * One catalog card: Cover, the complete title, a fixed two-line description
 * slot, and the publication state.
 *
 * The card carries exactly one control — the Article link, stretched across
 * the whole card by an overlay so that a click anywhere lands on it. Keyboard
 * focus therefore stops once per card; the ring is drawn on the card instead
 * of around the title so the focused target matches the clickable one.
 *
 * Tags and updated dates are deliberately absent: Tags are a filter in the
 * strip above, not card decoration.
 */
export const ArticleCard = ({
  article,
  eager,
}: {
  article: ArticleSummary;
  eager: boolean;
}) => (
  <div className="group relative flex h-full flex-col gap-2 rounded-lg p-2 transition-[background-color] ease-out hover:bg-accent has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring">
    <div className="relative">
      <ArticleCover cover={article.cover} eager={eager} />
      {article.status === "draft" ? <CoverDraftBadge /> : null}
    </div>

    <div className="flex flex-1 flex-col gap-1 p-2">
      {/* The title is never clamped: it is the catalog's primary information.
          The meta row below is pinned to the bottom instead, so publication
          dates stay in line across a row however long the titles run. */}
      <h2 className="text-lg leading-snug font-medium text-balance">
        <Link className="focus-visible:outline-none" href={article.href}>
          <span aria-hidden className="absolute inset-0" />
          {article.title}
        </Link>
      </h2>

      <p className="line-clamp-2 min-h-[2lh] text-sm text-muted-foreground">
        {article.description}
      </p>

      <div className="mt-auto pt-1">
        {/* A Draft may already carry a future publication date; the catalog
            still reports it as unpublished, because it is. */}
        <PublicationState
          publishedAt={article.status === "draft" ? null : article.publishedAt}
        />
      </div>
    </div>
  </div>
);
