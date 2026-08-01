// PROTOTYPE — throwaway. Delete this directory once issue #32 is decided.
//
// Variant B — "Tag facet strip" (revision 2, per Levin's feedback).
// A second lined strip under the search field carries single-select Tag facets
// with Article counts, so Tags are a real filter. The card also shows its Tags
// as Badges (as A did) and drops the updated date entirely. Draft is a Badge
// pinned on the Cover. Search results keep the Cover card and gain a
// highlighted snippet. Loading/error/no-results/zero leave the grid behind and
// render a centered Empty block instead of a cell inside it.

"use client";

import { SearchXIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type {
  ArticleSummary,
  ArticleTagFacet,
} from "@/modules/blog/articles/types";
import type { ArticleSearchSnippet } from "@/modules/blog/search";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/ui/cn";
import { Spinner } from "@/shared/ui/spinner";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty";
import type { Alignment, CardLayout, SnippetMode } from "./params";
import {
  CoverFrame,
  Highlight,
  PageHeading,
  PublishedDate,
  SearchField,
} from "./reference-chrome";
import type { PrototypeCatalog } from "./use-prototype-search";

const PROSE_CLASS = "line-clamp-2 min-h-[2lh] text-sm text-muted-foreground";

// The prose line under the title, switchable with ?snippet=.
//   always      — the description is always there; a query only swaps its text
//                 for whichever snippet matched. Card geometry never changes.
//   never       — no prose line at all; only title and Tag labels highlight.
//   conditional — prose only while searching, but then on *every* result card:
//                 result.snippet is null for a title- or Tag-only match, so
//                 falling back to the description keeps the rows even.
const CardProse = ({
  description,
  mode,
  searching,
  snippet,
}: {
  description: string;
  mode: SnippetMode;
  searching: boolean;
  snippet?: ArticleSearchSnippet | null;
}) => {
  if (mode === "never" || (mode === "conditional" && !searching)) {
    return null;
  }
  return snippet ? (
    <p className={PROSE_CLASS}>
      {snippet.leadingEllipsis ? "… " : null}
      <Highlight value={snippet} />
      {snippet.trailingEllipsis ? " …" : null}
    </p>
  ) : (
    <p className={PROSE_CLASS}>{description}</p>
  );
};

// Date and Tags, switchable with ?card=.
//   stacked — date on its own line, Tags underneath (revision 2 behaviour).
//   inline  — date and Tags share one line; Tags wrap when they run out of room.
//   no-tags — date only; the facet strip above already lists every Tag.
const CardMeta = ({
  article,
  layout,
}: {
  article: ArticleSummary;
  layout: CardLayout;
}) => {
  const date =
    article.publishedAt === null ? (
      <p className="text-sm text-muted-foreground">Not published</p>
    ) : (
      <PublishedDate isoDate={article.publishedAt} />
    );

  if (layout === "no-tags") {
    return date;
  }

  const tags = (
    <ul className="flex flex-wrap gap-1">
      {article.tags.map((tag) => (
        <li key={tag.id}>
          <Badge variant="outline">{tag.label}</Badge>
        </li>
      ))}
    </ul>
  );

  return layout === "inline" ? (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {date}
      {tags}
    </div>
  ) : (
    <>
      {date}
      {tags}
    </>
  );
};

// A title that wraps to three lines pushes its date and Tags out of line with
// the neighbouring card. Four ways out, switchable with ?align=.
const TITLE_CLASS: Record<Alignment, string> = {
  // Two lines of 1.375 leading reserved, title clamped to them: every card's
  // meta starts at the same y. Costs the tail of a very long title.
  "clamp-2": "line-clamp-2 min-h-[2lh]",
  // Meta pinned to the card bottom; the title grows upward into the free space.
  "meta-bottom": "",
  // What it does today: everything flows from the top.
  natural: "",
  // Two lines reserved, but a longer title is allowed to run past them.
  "reserve-2": "min-h-[2lh]",
};

const ArticleCard = ({
  alignment,
  article,
  cardLayout,
  eager,
  searching,
  snippet,
  snippetMode,
  title,
}: {
  alignment: Alignment;
  article: ArticleSummary;
  cardLayout: CardLayout;
  eager: boolean;
  searching: boolean;
  snippet?: ArticleSearchSnippet | null;
  snippetMode: SnippetMode;
  title: React.ReactNode;
}) => (
  <div className="group/post relative flex h-full flex-col gap-2 p-2 transition-[background-color] ease-out hover:bg-accent">
    <div className="relative">
      <CoverFrame alt={article.title} cover={article.cover} eager={eager} />
      {article.status === "draft" ? (
        <Badge className="absolute top-2 left-2 shadow-sm">Draft</Badge>
      ) : null}
    </div>

    <div className="flex flex-1 flex-col gap-1 p-2">
      <h2
        className={cn(
          "text-lg leading-snug font-medium text-balance",
          TITLE_CLASS[alignment]
        )}
      >
        <Link href={article.href}>
          <span aria-hidden className="absolute inset-0" />
          {title}
        </Link>
      </h2>

      <CardProse
        description={article.description}
        mode={snippetMode}
        searching={searching}
        snippet={snippet}
      />

      <div
        className={cn(
          "flex flex-col gap-1",
          alignment === "meta-bottom" ? "mt-auto pt-1" : null
        )}
      >
        <CardMeta article={article} layout={cardLayout} />
      </div>
    </div>
  </div>
);

const TagFacets = ({
  articleCount,
  onSelect,
  selected,
  tags,
}: {
  articleCount: number;
  onSelect: (tagId: string | null) => void;
  selected: string | null;
  tags: readonly ArticleTagFacet[];
}) => (
  <div className="screen-line-bottom flex flex-wrap items-center gap-1.5 p-2">
    <button
      aria-pressed={selected === null}
      onClick={() => {
        onSelect(null);
      }}
      type="button"
    >
      <Badge variant={selected === null ? "default" : "outline"}>
        All
        <span className="tabular-nums opacity-70">{articleCount}</span>
      </Badge>
    </button>

    {tags.map((tag) => (
      <button
        aria-pressed={selected === tag.id}
        key={tag.id}
        onClick={() => {
          onSelect(selected === tag.id ? null : tag.id);
        }}
        type="button"
      >
        <Badge variant={selected === tag.id ? "default" : "outline"}>
          {tag.label}
          <span className="tabular-nums opacity-70">{tag.articleCount}</span>
        </Badge>
      </button>
    ))}
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

const CatalogEmpty = ({
  description,
  media,
  title,
}: {
  description: string;
  media: React.ReactNode;
  title: string;
}) => (
  <div className="screen-line-top screen-line-bottom mt-4 py-12">
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">{media}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  </div>
);

export const VariantB = ({
  alignment,
  articles,
  cardLayout,
  query,
  results,
  setQuery,
  snippetMode,
  status,
  tags,
}: PrototypeCatalog & {
  alignment: Alignment;
  cardLayout: CardLayout;
  snippetMode: SnippetMode;
  tags: readonly ArticleTagFacet[];
}) => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const bySlug = new Map(articles.map((article) => [article.slug, article]));
  const searching = query.trim().length > 0;
  const hasTag = (article: ArticleSummary) =>
    selectedTag === null || article.tags.some((tag) => tag.id === selectedTag);

  const listed = articles.filter(hasTag);
  const matched = results.filter((result) => {
    const article = bySlug.get(result.id);
    return article !== undefined && hasTag(article);
  });

  const cards = searching
    ? matched.flatMap((result, index) => {
        const article = bySlug.get(result.id);
        return article === undefined
          ? []
          : [
              <li className={gridItemClassName} key={result.id}>
                <ArticleCard
                  alignment={alignment}
                  article={article}
                  cardLayout={cardLayout}
                  eager={index <= 3}
                  searching
                  snippet={result.snippet}
                  snippetMode={snippetMode}
                  title={<Highlight value={result.title} />}
                />
              </li>,
            ];
      })
    : listed.map((article, index) => (
        <li className={gridItemClassName} key={article.slug}>
          <ArticleCard
            alignment={alignment}
            article={article}
            cardLayout={cardLayout}
            eager={index <= 3}
            searching={false}
            snippetMode={snippetMode}
            title={article.title}
          />
        </li>
      ));

  const renderCatalog = () => {
    if (searching && status === "loading") {
      return (
        <CatalogEmpty
          description="Loading the search index for the first time."
          media={<Spinner />}
          title="Searching…"
        />
      );
    }

    if (searching && status === "error") {
      return (
        <CatalogEmpty
          description="The search index could not be loaded. Reload the page to try again."
          media={<TriangleAlertIcon aria-hidden />}
          title="Search is unavailable"
        />
      );
    }

    if (cards.length === 0) {
      if (searching) {
        return (
          <CatalogEmpty
            description={`Nothing matches “${query.trim()}”${selectedTag === null ? "" : " with this tag selected"}.`}
            media={<SearchXIcon aria-hidden />}
            title="No articles found"
          />
        );
      }

      return articles.length === 0 ? (
        <CatalogEmpty
          description="New writing will show up here."
          media={<SearchXIcon aria-hidden />}
          title="No published articles yet"
        />
      ) : (
        <CatalogEmpty
          description="No articles carry the selected tag."
          media={<SearchXIcon aria-hidden />}
          title="No articles for this tag"
        />
      );
    }

    return <CatalogGrid>{cards}</CatalogGrid>;
  };

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

      <TagFacets
        articleCount={articles.length}
        onSelect={setSelectedTag}
        selected={selectedTag}
        tags={tags}
      />

      {renderCatalog()}

      <div className="h-4" />
    </div>
  );
};
