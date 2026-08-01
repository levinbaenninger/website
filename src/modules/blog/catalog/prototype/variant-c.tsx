// PROTOTYPE — throwaway. Delete this directory once issue #32 is decided.
//
// Variant C — "Search-first toolbar, diverging results". Tags are multi-select
// chips on the same lined strip as the search field (scrollable at mobile), and
// a query swaps the Cover grid for a dense, highlight-forward result list: small
// Cover thumbnail, highlighted title and Tag labels, snippet with its origin and
// ellipses. Draft reads as a dashed Cover ring plus a text marker; updatedAt
// trails the published date.

"use client";

import Link from "next/link";
import { useState } from "react";

import type {
  ArticleSummary,
  ArticleTagFacet,
} from "@/modules/blog/articles/types";
import type { ArticleSearchResult } from "@/modules/blog/search";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/ui/cn";
import { Spinner } from "@/shared/ui/spinner";

import {
  CoverFrame,
  formatArticleDate,
  Highlight,
  PageHeading,
  SearchField,
} from "./reference-chrome";
import type { PrototypeCatalog } from "./use-prototype-search";

const SNIPPET_SOURCE_LABEL = {
  body: "In the article",
  description: "Summary",
  heading: "Heading",
} as const;

const CatalogCard = ({
  article,
  eager,
}: {
  article: ArticleSummary;
  eager: boolean;
}) => (
  <div className="group/post relative flex h-full flex-col gap-2 p-2 transition-[background-color] ease-out hover:bg-accent">
    <CoverFrame
      alt={article.title}
      cover={article.cover}
      eager={eager}
      ringClassName={
        article.status === "draft"
          ? "border border-dashed border-muted-foreground/60 inset-ring-0"
          : undefined
      }
    />

    <div className="flex flex-col gap-1 p-2">
      <h2 className="text-lg leading-snug font-medium text-balance">
        <Link href={article.href}>
          <span aria-hidden className="absolute inset-0" />
          {article.title}
        </Link>
      </h2>

      <div className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
        {article.status === "draft" ? (
          <span className="font-medium text-foreground">Draft</span>
        ) : (
          <time dateTime={article.publishedAt}>
            {formatArticleDate(article.publishedAt)}
          </time>
        )}
        {article.updatedAt === null ? null : (
          <span>· upd. {formatArticleDate(article.updatedAt)}</span>
        )}
      </div>
    </div>
  </div>
);

const ResultRow = ({
  article,
  result,
}: {
  article: ArticleSummary;
  result: ArticleSearchResult;
}) => (
  <li className="screen-line-bottom">
    <div className="group/post relative flex gap-3 p-2 transition-[background-color] ease-out hover:bg-accent">
      <div className="w-32 shrink-0 max-sm:w-24">
        <CoverFrame alt={article.title} cover={article.cover} eager />
      </div>

      <div className="flex min-w-0 flex-col gap-1 py-1">
        <h2 className="text-base leading-snug font-medium text-balance">
          <Link href={result.href}>
            <span aria-hidden className="absolute inset-0" />
            <Highlight value={result.title} />
          </Link>
          {result.status === "draft" ? (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              Draft
            </span>
          ) : null}
        </h2>

        {result.snippet ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            <span className="mr-1.5 font-mono text-xs uppercase">
              {SNIPPET_SOURCE_LABEL[result.snippet.source]}
            </span>
            {result.snippet.leadingEllipsis ? "… " : null}
            <Highlight value={result.snippet} />
            {result.snippet.trailingEllipsis ? " …" : null}
          </p>
        ) : null}

        <ul className="flex flex-wrap gap-1">
          {result.tags.map((tag) => (
            <li key={tag.id}>
              <Badge variant="outline">
                <Highlight value={tag.label} />
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </li>
);

const Notice = ({ children }: { children: React.ReactNode }) => (
  <li className="screen-line-top screen-line-bottom col-span-full p-4">
    <p className="flex items-center gap-2 font-mono text-sm">{children}</p>
  </li>
);

export const VariantC = ({
  articles,
  query,
  results,
  setQuery,
  status,
  tags,
}: PrototypeCatalog & { tags: readonly ArticleTagFacet[] }) => {
  const [selectedTags, setSelectedTags] = useState<readonly string[]>([]);
  const bySlug = new Map(articles.map((article) => [article.slug, article]));
  const searching = query.trim().length > 0;

  const toggleTag = (tagId: string) => {
    setSelectedTags((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId]
    );
  };

  const hasTags = (article: ArticleSummary) =>
    selectedTags.every((tagId) => article.tags.some((tag) => tag.id === tagId));

  const listed = articles.filter(hasTags);
  const matched = results.filter((result) => {
    const article = bySlug.get(result.id);
    return article !== undefined && hasTags(article);
  });

  return (
    <div>
      <PageHeading
        tagline="Blog"
        title="Writing about the web, tooling, and the craft in between."
      />

      <div className="h-4" />

      <div className="screen-line-top screen-line-bottom flex items-center gap-2 p-2 max-sm:flex-col max-sm:items-stretch">
        <SearchField
          className="sm:max-w-64"
          onQueryChange={setQuery}
          query={query}
        />

        <div className="-mx-2 flex gap-1.5 overflow-x-auto px-2 py-0.5 sm:mx-0 sm:px-0">
          {tags.map((tag) => (
            <button
              aria-pressed={selectedTags.includes(tag.id)}
              className="shrink-0"
              key={tag.id}
              onClick={() => {
                toggleTag(tag.id);
              }}
              type="button"
            >
              <Badge
                variant={selectedTags.includes(tag.id) ? "default" : "outline"}
              >
                {tag.label}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {searching ? (
        <ul className="pt-2">
          {status === "loading" ? (
            <Notice>
              <Spinner /> Searching…
            </Notice>
          ) : null}

          {status === "error" ? (
            <Notice>Search is unavailable. Reload to try again.</Notice>
          ) : null}

          {status === "ready"
            ? matched.map((result) => {
                const article = bySlug.get(result.id);
                return article === undefined ? null : (
                  <ResultRow
                    article={article}
                    key={result.id}
                    result={result}
                  />
                );
              })
            : null}

          {status === "ready" && matched.length === 0 ? (
            <Notice>No articles found.</Notice>
          ) : null}
        </ul>
      ) : (
        <div className="relative pt-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-1 grid grid-cols-1 gap-4 max-sm:hidden sm:grid-cols-2"
          >
            <div className="border-r border-line" />
            <div className="border-l border-line" />
          </div>

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {listed.map((article, index) => (
              <li
                className={cn(
                  "max-sm:screen-line-top max-sm:screen-line-bottom",
                  "sm:nth-[2n+1]:screen-line-top sm:nth-[2n+1]:screen-line-bottom"
                )}
                key={article.slug}
              >
                <CatalogCard article={article} eager={index <= 3} />
              </li>
            ))}

            {listed.length === 0 ? (
              <Notice>
                {articles.length === 0
                  ? "No published articles yet."
                  : "No articles carry every selected tag."}
              </Notice>
            ) : null}
          </ul>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
};
