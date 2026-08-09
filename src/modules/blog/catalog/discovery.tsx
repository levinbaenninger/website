"use client";

import { SearchIcon, TagIcon, XIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type {
  ArticleSummary,
  ArticleTagFacet,
} from "@/modules/blog/articles/types";
import { Button } from "@/shared/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/shared/ui/input-group";

import { CatalogEmpty } from "./catalog-empty";
import { CatalogGrid } from "./catalog-grid";
import { ALL_TAGS, articleCountLabel, TagFilter } from "./tag-filter";

// Filter edits replace the current entry: a visitor who tried four Tags wants
// Back to leave the Blog, not to walk their own filtering backwards. Shallow
// keeps the change in the browser — the server has already sent every Article.
const TAG_PARAM = parseAsString.withOptions({
  history: "replace",
  shallow: true,
});

// Hydration signal. The server snapshot is `false` and the client snapshot is
// `true`, so the server renders the inert catalog and the client swaps in the
// live one the moment React takes over. Nothing ever changes after that, hence
// the no-op subscription.
const noopSubscribe = () => () => {
  // Never emits: the value cannot change after hydration.
};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const filterByTag = (
  articles: readonly ArticleSummary[],
  tag: string
): readonly ArticleSummary[] =>
  tag === ALL_TAGS
    ? articles
    : articles.filter((article) => article.tags.some(({ id }) => id === tag));

const SearchField = ({
  enabled,
  onQueryChange,
  query,
}: {
  enabled: boolean;
  onQueryChange: (query: string) => void;
  query: string;
}) => {
  const fieldRef = useRef<HTMLInputElement>(null);

  return (
    <InputGroup className="h-9 rounded-lg shadow-none">
      <InputGroupInput
        aria-label="Search Articles"
        disabled={!enabled}
        onChange={(event) => {
          onQueryChange(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onQueryChange("");
          }
        }}
        placeholder="Search articles…"
        ref={fieldRef}
        type="search"
        value={query}
      />

      <InputGroupAddon align="inline-start">
        <SearchIcon aria-hidden />
      </InputGroupAddon>

      <InputGroupAddon
        align="inline-end"
        className="pr-2.25 data-[disabled=true]:hidden"
        data-disabled={query.length === 0}
      >
        <InputGroupButton
          aria-label="Clear search"
          className="rounded-sm border-none"
          onClick={() => {
            onQueryChange("");
            // Clearing hides this very button, so focus would fall to the
            // document. Put it back where the visitor was working.
            fieldRef.current?.focus();
          }}
          size="icon-xs"
          title="Clear search"
        >
          <XIcon aria-hidden />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
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

/**
 * The catalog once the client owns it: the same strips and the same grid, now
 * reading and writing the URL.
 *
 * The selected Tag lives in `?tag=`, and nowhere else: there is no second copy
 * of it in component state that could disagree with the address bar. An
 * unknown or stale Tag reads as `All` on the way in and drops out of the URL
 * on the next tick, leaving anything else in the query string alone.
 *
 * Filtering never reorders: the server's canonical Article order survives it,
 * because a filter only removes. The Article search that shares this island
 * arrives with #59; its query stays local until then.
 */
const LiveCatalog = ({
  articles,
  tags,
}: {
  articles: readonly ArticleSummary[];
  tags: readonly ArticleTagFacet[];
}) => {
  const [query, setQuery] = useState("");
  const [tagParam, setTagParam] = useQueryState("tag", TAG_PARAM);
  const [announcement, setAnnouncement] = useState("");
  const allOptionRef = useRef<HTMLInputElement>(null);

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

  const visible = filterByTag(articles, selected);
  const selectedLabel = tags.find(({ id }) => id === selected)?.label;

  const selectTag = (value: string) => {
    void setTagParam(value === ALL_TAGS ? null : value);

    const label = tags.find(({ id }) => id === value)?.label;
    const scope = label === undefined ? "" : ` in ${label}`;

    // A Tag change is a deliberate act, so it is announced at once rather than
    // waiting for anything to settle.
    setAnnouncement(
      `${articleCountLabel(filterByTag(articles, value).length)} found${scope}.`
    );
  };

  const showAllTags = () => {
    selectTag(ALL_TAGS);
    allOptionRef.current?.focus();
  };

  return (
    <>
      <div className="screen-line-top screen-line-bottom p-2">
        <SearchField enabled onQueryChange={setQuery} query={query} />
      </div>

      <TagFilter
        allOptionRef={allOptionRef}
        articleCount={articles.length}
        enabled
        onSelect={selectTag}
        selected={selected}
        tags={tags}
      />

      {/* Beside the group rather than inside it: a live region nested in a
          radio group is read as part of the group by some screen readers. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {visible.length === 0 ? (
        <CatalogEmpty
          action={
            <Button onClick={showAllTags} size="sm" variant="outline">
              Show all Tags
            </Button>
          }
          description="Nothing here answers to that. Try a wider net."
          media={<TagIcon aria-hidden />}
          title={`Nothing filed under ${selectedLabel ?? "that Tag"}`}
        />
      ) : (
        <CatalogGrid articles={visible} />
      )}
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
 * first paint carries every Article rather than a placeholder.
 *
 * The swap is invisible: both branches render the same strips over the same
 * grid, so nothing moves unless the URL actually asked for a Tag.
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
