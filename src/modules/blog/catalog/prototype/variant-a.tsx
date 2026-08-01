// PROTOTYPE — throwaway. Delete this directory once issue #32 is decided.
//
// Variant A — "Reference-strict". No filter chrome above the grid at all: the
// reference's search field is the only control, Tags ride inside the card meta
// as plain Badges, and typing a Tag label filters through Fuse's Tag weighting.
// Search results reuse the same Cover card; Draft and updated reuse the
// reference's small status dot.

"use client";

import Link from "next/link";

import type { ArticleSummary } from "@/modules/blog/articles/types";
import type { ArticleSearchResult } from "@/modules/blog/search";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/ui/cn";
import { Spinner } from "@/shared/ui/spinner";

import {
  CoverFrame,
  Highlight,
  PageHeading,
  PublishedDate,
  SearchField,
} from "./reference-chrome";
import type { PrototypeCatalog } from "./use-prototype-search";

// The reference separates its "new" and "updated" dots by colour alone. Draft is
// a local concept and must not read as "updated", so it gets a hollow ring.
const StatusDot = ({
  hollow = false,
  label,
}: {
  hollow?: boolean;
  label: string;
}) => (
  <span
    className={cn(
      "pointer-events-none ml-2 inline-block size-2 -translate-y-px rounded-full",
      hollow ? "ring-1 ring-muted-foreground" : "bg-foreground"
    )}
  >
    <span className="sr-only">{label}</span>
  </span>
);

const ArticleCard = ({
  article,
  eager,
  title,
}: {
  article: ArticleSummary;
  eager: boolean;
  title: React.ReactNode;
}) => (
  <div className="group/post relative flex h-full flex-col gap-2 p-2 transition-[background-color] ease-out hover:bg-accent">
    <CoverFrame alt={article.title} cover={article.cover} eager={eager} />

    <div className="flex flex-col gap-1 p-2">
      <h2 className="text-lg leading-snug font-medium text-balance">
        <Link href={article.href}>
          <span aria-hidden className="absolute inset-0" />
          {title}
        </Link>
        {article.status === "draft" ? <StatusDot hollow label="Draft" /> : null}
        {article.status === "published" && article.updatedAt !== null ? (
          <StatusDot label="Updated" />
        ) : null}
      </h2>

      {article.publishedAt === null ? (
        <p className="text-sm text-muted-foreground">Not published</p>
      ) : (
        <PublishedDate isoDate={article.publishedAt} />
      )}

      <ul className="flex flex-wrap gap-1">
        {article.tags.map((tag) => (
          <li key={tag.id}>
            <Badge variant="outline">{tag.label}</Badge>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const CatalogGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="relative pt-4">
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-1 grid grid-cols-1 gap-4 max-sm:hidden sm:grid-cols-2"
    >
      <div className="border-r border-line" />
      <div className="border-l border-line" />
    </div>

    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</ul>
  </div>
);

const gridItemClassName = cn(
  "max-sm:screen-line-top max-sm:screen-line-bottom",
  "sm:nth-[2n+1]:screen-line-top sm:nth-[2n+1]:screen-line-bottom"
);

const Notice = ({ children }: { children: React.ReactNode }) => (
  <li className="screen-line-top screen-line-bottom col-span-full p-4">
    <p className="flex items-center gap-2 font-mono text-sm">{children}</p>
  </li>
);

export const VariantA = ({
  articles,
  query,
  results,
  setQuery,
  status,
}: PrototypeCatalog) => {
  const bySlug = new Map(articles.map((article) => [article.slug, article]));
  const searching = query.trim().length > 0;
  const matched: readonly ArticleSearchResult[] = results;

  return (
    <div>
      <PageHeading
        tagline="Blog"
        title="Writing about the web, tooling, and the craft in between."
      />

      <div className="h-4" />

      <div className="screen-line-top screen-line-bottom p-2">
        <SearchField onQueryChange={setQuery} query={query} />
      </div>

      <CatalogGrid>
        {searching
          ? null
          : articles.map((article, index) => (
              <li className={gridItemClassName} key={article.slug}>
                <ArticleCard
                  article={article}
                  eager={index <= 3}
                  title={article.title}
                />
              </li>
            ))}

        {searching && status === "loading" ? (
          <Notice>
            <Spinner /> Searching…
          </Notice>
        ) : null}

        {searching && status === "error" ? (
          <Notice>Search is unavailable. Reload to try again.</Notice>
        ) : null}

        {searching && status === "ready"
          ? matched.map((result, index) => {
              const article = bySlug.get(result.id);
              return article === undefined ? null : (
                <li className={gridItemClassName} key={result.id}>
                  <ArticleCard
                    article={article}
                    eager={index <= 3}
                    title={<Highlight value={result.title} />}
                  />
                </li>
              );
            })
          : null}

        {searching && status === "ready" && matched.length === 0 ? (
          <Notice>No articles found.</Notice>
        ) : null}

        {!searching && articles.length === 0 ? (
          <Notice>No published articles yet.</Notice>
        ) : null}
      </CatalogGrid>

      <div className="h-4" />
    </div>
  );
};
