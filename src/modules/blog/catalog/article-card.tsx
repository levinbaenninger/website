import Link from "next/link";

import type { ArticleSummary } from "@/modules/blog/articles/types";
import type {
  ArticleSearchSnippet,
  HighlightedText as HighlightedTextValue,
} from "@/modules/blog/search/service";

import { ArticleCover, CoverDraftBadge, PublicationState } from "./chrome";
import { HighlightedText } from "./highlighted-text";

/**
 * Why this card is in the results, in the card's own words.
 *
 * A description that did not match is left unmarked prose — marking it would
 * claim a match the query never made. The two cropped sources say what they
 * are for a screen reader, because "…enforces: a validation step…" out of
 * context is not obviously an excerpt from the Article body.
 */
const SNIPPET_PREFIX: Readonly<Record<ArticleSearchSnippet["source"], string>> =
  {
    body: "Matching excerpt:",
    description: "",
    heading: "Matching section:",
  };

const CardProse = ({
  description,
  snippet,
}: {
  description: string;
  snippet: ArticleSearchSnippet | null;
}) => {
  if (snippet === null) {
    return description;
  }

  const prefix = SNIPPET_PREFIX[snippet.source];

  return (
    <>
      {prefix === "" ? null : <span className="sr-only">{prefix} </span>}
      {snippet.leadingEllipsis ? "…" : null}
      <HighlightedText value={snippet} />
      {snippet.trailingEllipsis ? "…" : null}
    </>
  );
};

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
 * strip above, not card decoration. A Tag-only match is explained there too.
 *
 * `title` and `snippet` are what an active query adds, and they are the only
 * things it adds: the same Cover, the same two-line prose slot and the same
 * pinned meta row, so a card never changes shape mid-keystroke.
 */
export const ArticleCard = ({
  article,
  eager,
  snippet = null,
  title = null,
}: {
  article: ArticleSummary;
  eager: boolean;
  snippet?: ArticleSearchSnippet | null;
  title?: HighlightedTextValue | null;
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
        {/* Named explicitly while highlighting: a `<mark>` that lands inside a
            word splits the link's accessible name across elements, and the
            link must stay named by the complete title however a query fell. */}
        <Link
          aria-label={title === null ? undefined : article.title}
          className="focus-visible:outline-none"
          href={article.href}
        >
          <span aria-hidden className="absolute inset-0" />
          {title === null ? article.title : <HighlightedText value={title} />}
        </Link>
      </h2>

      <p className="line-clamp-2 min-h-[2lh] text-sm text-muted-foreground">
        <CardProse description={article.description} snippet={snippet} />
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
