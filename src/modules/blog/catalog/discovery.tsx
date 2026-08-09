"use client";

import { SearchXIcon, TagIcon, TriangleAlertIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type {
  ArticleSummary,
  ArticleTagFacet,
} from "@/modules/blog/articles/types";
import {
  isEffectiveArticleSearchQuery,
  normalizeArticleSearchQuery,
} from "@/modules/blog/search/query";
import type {
  ArticleSearchResult,
  HighlightRange,
} from "@/modules/blog/search/service";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";

import { CatalogEmpty } from "./catalog-empty";
import { CatalogGrid } from "./catalog-grid";
import { SearchField } from "./search-field";
import { ALL_TAGS, articleCountLabel, TagFilter } from "./tag-filter";
import { useArticleSearch } from "./use-article-search";
import type { ArticleSearchStatus } from "./use-article-search";

// Filter edits replace the current entry: a visitor who tried four Tags wants
// Back to leave the Blog, not to walk their own filtering backwards. Shallow
// keeps the change in the browser — the server has already sent every Article.
const DISCOVERY_PARAM = parseAsString.withOptions({
  history: "replace",
  shallow: true,
});

// Long enough that a search which settles quickly never shows a loading state
// at all, short enough that a slow one does not look broken.
const LOADING_EMPTY_DELAY_MS = 150;

// Result cards update on the keystroke; only the spoken count waits for typing
// to settle, so a screen reader is not read a new number per letter.
const ANNOUNCEMENT_DELAY_MS = 300;

// Hydration signal. The server snapshot is `false` and the client snapshot is
// `true`, so the server renders the inert catalog and the client swaps in the
// live one the moment React takes over. Nothing ever changes after that, hence
// the no-op subscription.
const noopSubscribe = () => () => {
  // Never emits: the value cannot change after hydration.
};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const noCleanup = () => {
  // Nothing was scheduled, so there is nothing to undo.
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

/**
 * The query's matches, in Fuse's relevance order, as catalog Articles.
 *
 * A result whose Article the server did not send is dropped rather than
 * rendered from the artifact. The two are built from the same source, so this
 * only bites when a cached artifact outlives a deploy — and then the visible
 * catalog, not the stale asset, decides what a visitor may see. That is what
 * keeps an unpublished Article out of results even if it once had a document.
 */
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

/**
 * The first highlighted occurrence of each matched Tag label.
 *
 * One entry per Tag rather than per result: the strip shows a Tag once, and
 * the ranges only ever describe that Tag's own label.
 */
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

/**
 * `true` once `active` has been true for longer than `delayMs`.
 *
 * The catalog is marked busy the instant a load starts, but the grid is only
 * replaced once this turns true, so a load that settles inside the delay goes
 * straight from the previous cards to the results with nothing in between.
 */
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

/**
 * What the server renders, and what a visitor without JavaScript keeps.
 *
 * The complete linked catalog, under the same two strips the live catalog
 * renders — disabled, because nothing behind them is listening yet. Nothing
 * here reads the URL, which is what lets `/blog` stay a static page.
 */
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

/**
 * Everything below the two strips: the grid, or the one centered block that
 * replaces it.
 *
 * Each Empty offers exactly the actions that widen the catalog again, and each
 * action clears only the constraint it names — `Clear search` never touches
 * the Tag, `Show all Tags` never touches the query.
 */
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

/**
 * The catalog once the client owns it: the same strips and the same grid, now
 * reading and writing the URL and searching.
 *
 * The discovery state lives in `?q=` and `?tag=`, and nowhere else: there is
 * no second copy in component state that could disagree with the address bar.
 * The single exception is the field itself, which may hold one trailing space
 * the URL never sees — see `normalizeArticleSearchQuery`. An unknown or stale
 * Tag reads as `All` on the way in and drops out of the URL on the next tick,
 * leaving anything else in the query string alone.
 *
 * Browsing and Tag filtering never reorder: the server's canonical Article
 * order survives them, because a filter only removes. An active query replaces
 * that order with relevance, and applying a Tag to it removes without
 * reordering in exactly the same way.
 */
const LiveCatalog = ({
  articles,
  tags,
}: {
  articles: readonly ArticleSummary[];
  tags: readonly ArticleTagFacet[];
}) => {
  const [queryParam, setQueryParam] = useQueryState("q", DISCOVERY_PARAM);
  const [tagParam, setTagParam] = useQueryState("tag", DISCOVERY_PARAM);
  const fieldRef = useRef<HTMLInputElement>(null);
  const allOptionRef = useRef<HTMLInputElement>(null);

  // The field is seeded from `?q=` once, on the render that first owns the
  // catalog, and drives it from then on. It is not kept in sync in the other
  // direction: `q` is written throttled and `history: "replace"` leaves no
  // entry to go back to, so a URL that "changed on its own" is not a state
  // this island can be in — while an echo of a throttled write would arrive
  // mid-word and take the visitor's typing with it.
  const [field, setField] = useState(() =>
    normalizeArticleSearchQuery(queryParam ?? "")
  );

  const known = tags.some(({ id }) => id === tagParam);
  const selected = known && tagParam !== null ? tagParam : ALL_TAGS;

  useEffect(() => {
    // A Tag that no longer exists — renamed, or emptied by an unpublished
    // Article — is not an error worth showing. It degrades to `All` above and
    // the parameter is written out of the URL here.
    if (tagParam !== null && !known) {
      void setTagParam(null);
    }
  }, [known, setTagParam, tagParam]);

  const query = field.trim();
  const searching = isEffectiveArticleSearchQuery(field);
  const { results, retry, status } = useArticleSearch(query);
  const loadingVisible = useDelayed(
    status === "loading",
    LOADING_EMPTY_DELAY_MS
  );

  const searched =
    status === "ready" ? projectResults(articles, results) : null;
  // Until results exist the counts stay catalog-wide, so no chip changes width
  // while the artifact is still in flight or after it failed to arrive.
  const facets = searched === null ? tags : countByTag(searched, tags);
  const matched = searched ?? articles;
  const visible = filterByTag(matched, selected);
  const selectedLabel = tags.find(({ id }) => id === selected)?.label;

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
    // Clearing hides the Clear control, so focus would fall to the document.
    // Put it back where the visitor was working.
    fieldRef.current?.focus();
  };

  const retrySearch = () => {
    retry();
    fieldRef.current?.focus();
  };

  const selectTag = (value: string) => {
    void setTagParam(value === ALL_TAGS ? null : value);
  };

  const showAllTags = () => {
    selectTag(ALL_TAGS);
    allOptionRef.current?.focus();
  };

  // The failure speaks for itself in the alert region below; repeating the
  // last count beside it would only contradict what is on screen.
  let message = "";
  if (status === "loading") {
    message = "Searching Articles.";
  } else if (status !== "error") {
    message = resultAnnouncement(visible.length, query, selectedLabel);
  }

  const [announcement, setAnnouncement] = useState("");
  const announcedTag = useRef(selected);
  const announced = useRef(false);

  useEffect(() => {
    // A Tag change is a deliberate act with one obvious answer, so it is
    // spoken at once. Typing is a stream, and waiting for it to settle is what
    // keeps a screen reader from reading a new count per letter.
    //
    // Deduplication is the message itself: writing the same string twice
    // changes no DOM, so a repeat is never spoken. The accepted cost is that
    // two different queries with the same count and Tag — `1 Article found for
    // ‘x’.` is not one of them, because the query is in the sentence — would
    // pass in silence. Every state a visitor can reach names itself, so in
    // practice the only strings that collide are ones that mean the same
    // thing.
    const deliberate = announcedTag.current !== selected;
    announcedTag.current = selected;

    // Arriving on the Blog is not a result change. The first state the visitor
    // is handed is the one they can see, so nothing is read out until they
    // have actually asked the catalog for something.
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

      {/* Beside the group rather than inside it: a live region nested in a
          radio group is read as part of the group by some screen readers. */}
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

/**
 * The catalog's discovery island.
 *
 * It renders the inert catalog until the client has taken over, and only then
 * mounts the part that reads the URL. That order is the point: a component
 * that reads search params cannot be prerendered, and `/blog` is a static
 * page, so asking for them one render too early either drags the whole route
 * into request rendering or — at this Next version — fails the build outright.
 * Deferring the read by one render keeps the page static, and the visitor's
 * first paint carries every Article rather than a placeholder. A shared `?q=`
 * link therefore lands on the complete catalog and upgrades to its results
 * once the island hydrates.
 *
 * The swap is invisible: both branches render the same strips over the same
 * grid, so nothing moves unless the URL actually asked for something.
 */
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
