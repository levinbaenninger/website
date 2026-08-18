"use client";

import { SearchXIcon, TagIcon, TriangleAlertIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type {
  ArticleSummary,
  ArticleTagFacet,
} from "@/features/blog/articles/types";
import {
  isEffectiveArticleSearchQuery,
  normalizeArticleSearchQuery,
} from "@/features/blog/search/query";
import type {
  ArticleSearchResult,
  HighlightRange,
} from "@/features/blog/search/service";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";

import { CatalogEmpty } from "./catalog-empty";
import { CatalogGrid } from "./catalog-grid";
import { SearchField } from "./search-field";
import { ALL_TAGS, articleCountLabel, TagFilter } from "./tag-filter";
import { useArticleSearch } from "./use-article-search";
import type { ArticleSearchStatus } from "./use-article-search";

// Replace so Back leaves the Blog instead of walking filter history; shallow because the server already sent every Article.
const DISCOVERY_PARAM = parseAsString.withOptions({
  history: "replace",
  shallow: true,
});

const LOADING_EMPTY_DELAY_MS = 150;

const ANNOUNCEMENT_DELAY_MS = 300;

const noopSubscribe = () => () => {
  // The value cannot change after hydration, so nothing to emit.
};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const noCleanup = () => {
  // Nothing was scheduled.
};

const filterByTag = (
  articles: readonly ArticleSummary[],
  tag: string
): readonly ArticleSummary[] =>
  tag === ALL_TAGS
    ? articles
    : articles.filter((article) => article.tags.some(({ id }) => id === tag));

const countByTag = (
  articles: readonly ArticleSummary[],
  tags: readonly ArticleTagFacet[]
): readonly ArticleTagFacet[] =>
  tags.map((tag) => ({
    ...tag,
    articleCount: filterByTag(articles, tag.id).length,
  }));

// Drop matches the server did not send. A cached artifact can outlive a deploy.
const projectResults = (
  articles: readonly ArticleSummary[],
  results: readonly ArticleSearchResult[]
): readonly ArticleSummary[] => {
  const bySlug = new Map(articles.map((article) => [article.slug, article]));

  return results.flatMap((result) => {
    const article = bySlug.get(result.id);
    return article === undefined ? [] : [article];
  });
};

const explanationsBySlug = (
  results: readonly ArticleSearchResult[]
): ReadonlyMap<string, ArticleSearchResult> =>
  new Map(results.map((result) => [result.id, result]));

const tagHighlights = (
  results: readonly ArticleSearchResult[]
): ReadonlyMap<string, readonly HighlightRange[]> => {
  const highlights = new Map<string, readonly HighlightRange[]>();

  for (const result of results) {
    for (const tag of result.tags) {
      if (tag.label.highlights.length > 0 && !highlights.has(tag.id)) {
        highlights.set(tag.id, tag.label.highlights);
      }
    }
  }

  return highlights;
};

const resultAnnouncement = (
  count: number,
  query: string,
  tagLabel: string | undefined
): string =>
  `${articleCountLabel(count)} found${
    query === "" ? "" : ` for ‘${query}’`
  }${tagLabel === undefined ? "" : ` in ${tagLabel}`}.`;

const useDelayed = (active: boolean, delayMs: number): boolean => {
  const [elapsed, setElapsed] = useState(false);
  const [wasActive, setWasActive] = useState(active);

  if (wasActive !== active) {
    setWasActive(active);
    setElapsed(false);
  }

  useEffect(() => {
    if (!active) {
      return noCleanup;
    }

    const timer = setTimeout(() => {
      setElapsed(true);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [active, delayMs]);

  return active && elapsed;
};

const ignoreQuery = () => {
  // The prerendered controls are inert; only the live catalog reads them.
};

const CatalogFallback = ({
  articles,
  tags,
}: {
  articles: readonly ArticleSummary[];
  tags: readonly ArticleTagFacet[];
}) => (
  <>
    <div className="screen-line-top screen-line-bottom p-2">
      <SearchField enabled={false} onQueryChange={ignoreQuery} query="" />
    </div>

    <TagFilter
      articleCount={articles.length}
      enabled={false}
      onSelect={ignoreQuery}
      selected={ALL_TAGS}
      tags={tags}
    />

    <CatalogGrid articles={articles} />
  </>
);

const EmptyActions = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center justify-center gap-2">
    {children}
  </div>
);

const CatalogBody = ({
  explanations,
  loadingVisible,
  onClearSearch,
  onRetry,
  onShowAllTags,
  query,
  searching,
  selectedLabel,
  status,
  visible,
}: {
  explanations: ReadonlyMap<string, ArticleSearchResult> | undefined;
  loadingVisible: boolean;
  onClearSearch: () => void;
  onRetry: () => void;
  onShowAllTags: () => void;
  query: string;
  searching: boolean;
  selectedLabel: string | undefined;
  status: ArticleSearchStatus;
  visible: readonly ArticleSummary[];
}) => {
  if (status === "error") {
    return (
      <CatalogEmpty
        action={
          <EmptyActions>
            <Button onClick={onRetry} size="sm">
              Retry search
            </Button>
            <Button onClick={onClearSearch} size="sm" variant="outline">
              Clear search
            </Button>
          </EmptyActions>
        }
        description="The Articles are still here. Try again, or clear the search and browse the old-fashioned way."
        media={<TriangleAlertIcon aria-hidden />}
        title="Search lost the plot"
      />
    );
  }

  if (loadingVisible) {
    return (
      <CatalogEmpty
        description="The search index is waking up. This should be quick."
        media={<Spinner />}
        title="Leafing through the Blog…"
      />
    );
  }

  if (visible.length > 0) {
    return <CatalogGrid articles={visible} explanations={explanations} />;
  }

  if (searching) {
    return (
      <CatalogEmpty
        action={
          <EmptyActions>
            <Button onClick={onClearSearch} size="sm">
              Clear search
            </Button>
            {selectedLabel === undefined ? null : (
              <Button onClick={onShowAllTags} size="sm" variant="outline">
                Show all Tags
              </Button>
            )}
          </EmptyActions>
        }
        description="Nothing here answers to that. Try a wider net."
        media={<SearchXIcon aria-hidden />}
        title={`No luck with ‘${query}’${
          selectedLabel === undefined ? "" : ` in ${selectedLabel}`
        }`}
      />
    );
  }

  return (
    <CatalogEmpty
      action={
        <Button onClick={onShowAllTags} size="sm" variant="outline">
          Show all Tags
        </Button>
      }
      description="Nothing here answers to that. Try a wider net."
      media={<TagIcon aria-hidden />}
      title={`Nothing filed under ${selectedLabel ?? "that Tag"}`}
    />
  );
};

const useCatalogQueryField = () => {
  const [queryParam, setQueryParam] = useQueryState("q", DISCOVERY_PARAM);
  const fieldRef = useRef<HTMLInputElement>(null);
  // Seeded from `?q=` once. Echoing the URL back would steal typing mid-word.
  const [field, setField] = useState(() =>
    normalizeArticleSearchQuery(queryParam ?? "")
  );

  const commitQuery = (value: string) => {
    const next = normalizeArticleSearchQuery(value, {
      preserveTrailingSpace: true,
    });
    const canonical = next.trimEnd();

    setField(next);
    void setQueryParam(canonical === "" ? null : canonical);
  };

  const clearSearch = () => {
    commitQuery("");
    fieldRef.current?.focus();
  };

  return { clearSearch, commitQuery, field, fieldRef, setField };
};

const useCatalogTagSelection = (tags: readonly ArticleTagFacet[]) => {
  const [tagParam, setTagParam] = useQueryState("tag", DISCOVERY_PARAM);
  const allOptionRef = useRef<HTMLInputElement>(null);
  const known = tags.some(({ id }) => id === tagParam);
  const selected = known && tagParam !== null ? tagParam : ALL_TAGS;
  const selectedLabel = tags.find(({ id }) => id === selected)?.label;

  useEffect(() => {
    if (tagParam !== null && !known) {
      void setTagParam(null);
    }
  }, [known, setTagParam, tagParam]);

  const selectTag = (value: string) => {
    void setTagParam(value === ALL_TAGS ? null : value);
  };

  const showAllTags = () => {
    selectTag(ALL_TAGS);
    allOptionRef.current?.focus();
  };

  return { allOptionRef, selectTag, selected, selectedLabel, showAllTags };
};

const useCatalogMatches = (
  articles: readonly ArticleSummary[],
  tags: readonly ArticleTagFacet[],
  field: string,
  selected: string
) => {
  const query = field.trim();
  const searching = isEffectiveArticleSearchQuery(field);
  const { results, retry, status } = useArticleSearch(query);
  const loadingVisible = useDelayed(
    status === "loading",
    LOADING_EMPTY_DELAY_MS
  );
  const searched =
    status === "ready" ? projectResults(articles, results) : null;
  const facets = searched === null ? tags : countByTag(searched, tags);
  const matched = searched ?? articles;
  const visible = filterByTag(matched, selected);

  return {
    facets,
    loadingVisible,
    matched,
    query,
    results,
    retry,
    searched,
    searching,
    status,
    visible,
  };
};

const catalogStatusMessage = (
  status: ArticleSearchStatus,
  visibleCount: number,
  query: string,
  selectedLabel: string | undefined
): string => {
  if (status === "loading") {
    return "Searching Articles.";
  }
  if (status === "error") {
    return "";
  }
  return resultAnnouncement(visibleCount, query, selectedLabel);
};

const useCatalogAnnouncement = (
  status: ArticleSearchStatus,
  visibleCount: number,
  query: string,
  selected: string,
  selectedLabel: string | undefined
) => {
  const message = catalogStatusMessage(
    status,
    visibleCount,
    query,
    selectedLabel
  );
  const [announcement, setAnnouncement] = useState("");
  const announcedTag = useRef(selected);
  const announced = useRef(false);

  useEffect(() => {
    const deliberate = announcedTag.current !== selected;
    announcedTag.current = selected;

    if (!announced.current) {
      announced.current = true;
      return noCleanup;
    }

    const timer = setTimeout(
      () => {
        setAnnouncement(message);
      },
      deliberate ? 0 : ANNOUNCEMENT_DELAY_MS
    );

    return () => {
      clearTimeout(timer);
    };
  }, [message, selected]);

  return announcement;
};

const LiveCatalog = ({
  articles,
  tags,
}: {
  articles: readonly ArticleSummary[];
  tags: readonly ArticleTagFacet[];
}) => {
  const { clearSearch, commitQuery, field, fieldRef, setField } =
    useCatalogQueryField();
  const { allOptionRef, selectTag, selected, selectedLabel, showAllTags } =
    useCatalogTagSelection(tags);
  const {
    facets,
    loadingVisible,
    matched,
    query,
    results,
    retry,
    searched,
    searching,
    status,
    visible,
  } = useCatalogMatches(articles, tags, field, selected);
  const announcement = useCatalogAnnouncement(
    status,
    visible.length,
    query,
    selected,
    selectedLabel
  );

  const retrySearch = () => {
    retry();
    fieldRef.current?.focus();
  };

  return (
    <>
      <div className="screen-line-top screen-line-bottom p-2">
        <SearchField
          enabled
          fieldRef={fieldRef}
          onBlur={() => {
            setField(field.trimEnd());
          }}
          onClear={clearSearch}
          onQueryChange={commitQuery}
          query={field}
        />
      </div>

      <TagFilter
        allOptionRef={allOptionRef}
        articleCount={matched.length}
        busy={status === "loading"}
        enabled
        highlights={searched === null ? undefined : tagHighlights(results)}
        onSelect={selectTag}
        selected={selected}
        tags={facets}
      />

      {/* Nested live regions in a radio group are read as part of the group. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {status === "error" ? (
        <p className="sr-only" role="alert">
          Article search could not be loaded.
        </p>
      ) : null}

      <CatalogBody
        explanations={
          searched === null ? undefined : explanationsBySlug(results)
        }
        loadingVisible={loadingVisible}
        onClearSearch={clearSearch}
        onRetry={retrySearch}
        onShowAllTags={showAllTags}
        query={query}
        searching={searching}
        selectedLabel={selected === ALL_TAGS ? undefined : selectedLabel}
        status={status}
        visible={visible}
      />
    </>
  );
};

// Deferred: a search-params read cannot be prerendered and fails the build.
export const CatalogDiscovery = ({
  articles,
  tags,
}: {
  articles: readonly ArticleSummary[];
  tags: readonly ArticleTagFacet[];
}) => {
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  return hydrated ? (
    <LiveCatalog articles={articles} tags={tags} />
  ) : (
    <CatalogFallback articles={articles} tags={tags} />
  );
};
