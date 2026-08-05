"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import type { ArticleTagFacet } from "@/modules/blog/articles/types";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/ui/cn";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/shared/ui/input-group";

const ALL_TAGS = "all";

// Hydration signal. The server snapshot is `false` and the client snapshot is
// `true`, so the controls render disabled in the prerendered HTML and enable
// themselves the moment React takes over. Nothing ever changes on the client,
// hence the no-op subscription.
const noopSubscribe = () => () => {
  // Never emits: the value cannot change after hydration.
};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const articleCountLabel = (count: number): string =>
  `${count} ${count === 1 ? "Article" : "Articles"}`;

const SearchField = ({
  enabled,
  onQueryChange,
  query,
}: {
  enabled: boolean;
  onQueryChange: (query: string) => void;
  query: string;
}) => (
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
        }}
        size="icon-xs"
        title="Clear search"
      >
        <XIcon aria-hidden />
      </InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
);

const TagOption = ({
  count,
  enabled,
  label,
  onSelect,
  selected,
  value,
}: {
  count: number;
  enabled: boolean;
  label: string;
  onSelect: (value: string) => void;
  selected: boolean;
  value: string;
}) => (
  <label className={cn("cursor-pointer", enabled ? null : "cursor-default")}>
    <input
      checked={selected}
      className="peer sr-only"
      disabled={!enabled}
      name="tag"
      onChange={() => {
        onSelect(value);
      }}
      type="radio"
      value={value}
    />
    <Badge
      className="peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:opacity-50"
      variant={selected ? "default" : "outline"}
    >
      {label}
      <span aria-hidden className="tabular-nums opacity-70">
        {count}
      </span>
    </Badge>
    <span className="sr-only">{articleCountLabel(count)}</span>
  </label>
);

const TagFilter = ({
  articleCount,
  enabled,
  onSelect,
  selected,
  tags,
}: {
  articleCount: number;
  enabled: boolean;
  onSelect: (value: string) => void;
  selected: string;
  tags: readonly ArticleTagFacet[];
}) => (
  <div
    aria-label="Filter Articles by Tag"
    className="screen-line-bottom flex flex-wrap items-center gap-1.5 p-2"
    role="radiogroup"
  >
    <TagOption
      count={articleCount}
      enabled={enabled}
      label="All"
      onSelect={onSelect}
      selected={selected === ALL_TAGS}
      value={ALL_TAGS}
    />
    {tags.map((tag) => (
      <TagOption
        count={tag.articleCount}
        enabled={enabled}
        key={tag.id}
        label={tag.label}
        onSelect={onSelect}
        selected={selected === tag.id}
        value={tag.id}
      />
    ))}
  </div>
);

/**
 * The catalog's discovery controls.
 *
 * The server prerenders them disabled, beside the complete Article set, so a
 * visitor sees the whole catalog before any JavaScript arrives and the layout
 * does not move when the controls come alive. Selection and query state stay
 * local for now; URL-backed Tag filtering and Article search arrive with the
 * sequenced work on top of this shell (#58, #59).
 */
export const CatalogDiscovery = ({
  articleCount,
  tags,
}: {
  articleCount: number;
  tags: readonly ArticleTagFacet[];
}) => {
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    getClientSnapshot,
    getServerSnapshot
  );
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>(ALL_TAGS);

  return (
    <>
      <div className="screen-line-top screen-line-bottom p-2">
        <SearchField
          enabled={hydrated}
          onQueryChange={setQuery}
          query={query}
        />
      </div>

      <TagFilter
        articleCount={articleCount}
        enabled={hydrated}
        onSelect={setSelectedTag}
        selected={selectedTag}
        tags={tags}
      />
    </>
  );
};
