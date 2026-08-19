import Link from "next/link";

import type { ArticleSummary } from "@/features/blog/articles/types";
import type {
  ArticleSearchSnippet,
  HighlightedText as HighlightedTextValue,
} from "@/features/blog/search/service";

import { ArticleCover, CoverDraftBadge, PublicationState } from "./chrome";
import { HighlightedText } from "./highlighted-text";

const SNIPPET_PREFIX = {
  body: "Matching excerpt:",
  description: "",
  heading: "Matching section:",
} satisfies Readonly<Record<ArticleSearchSnippet["source"], string>>;

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
  <div className="group relative flex h-full flex-col gap-2 rounded-lg p-2 transition-colors ease-out hover:bg-accent has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring">
    <div className="relative">
      <ArticleCover cover={article.cover} eager={eager} />
      {article.status === "draft" ? <CoverDraftBadge /> : null}
    </div>

    <div className="flex flex-1 flex-col gap-1 p-2">
      <h2 className="text-lg leading-snug font-medium text-balance">
        {/* A `<mark>` inside a word splits the accessible name, so the link is named by the complete title. */}
        <Link
          aria-label={title === null ? undefined : article.title}
          className="focus-visible:outline-none"
          href={article.href}
        >
          <span aria-hidden className="absolute inset-0" />
          {title === null ? article.title : <HighlightedText value={title} />}
        </Link>
      </h2>
      <p
        // fallow-ignore-next-line css-token-drift
        className="line-clamp-2 min-h-[2lh] text-sm text-muted-foreground"
      >
        <CardProse description={article.description} snippet={snippet} />
      </p>
      <div className="mt-auto pt-1">
        <PublicationState
          publishedAt={article.status === "draft" ? null : article.publishedAt}
        />
      </div>
    </div>
  </div>
);
