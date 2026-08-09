"use client";

import { useCallback, useEffect, useState } from "react";

import { loadArticleSearch } from "@/features/blog/search/loader";
import type {
  ArticleSearch,
  ArticleSearchResult,
} from "@/features/blog/search/service";

export type ArticleSearchStatus = "idle" | "loading" | "ready" | "error";

const NO_RESULTS: readonly ArticleSearchResult[] = [];

const noCleanup = () => {
  // Nothing was scheduled, so there is nothing to undo.
};

export interface ArticleSearchState {
  readonly results: readonly ArticleSearchResult[];
  readonly retry: () => void;
  readonly status: ArticleSearchStatus;
}

/**
 * Article search, loaded the first time a visitor actually asks for it.
 *
 * Fuse and `/blog/search.json` are together the most expensive thing the Blog
 * can send, and most visitors never search. Neither is fetched on focus, on
 * hydration, or for a query of only whitespace — only when there is something
 * to look for. Once loaded they are reused for the rest of the page's life,
 * so every later keystroke searches synchronously with no debounce.
 *
 * A failure latches. The effect deliberately does not depend on the query, so
 * a visitor whose network dropped types out their word against a stable error
 * instead of firing a request per keystroke; `retry` and clearing the query
 * are the only two ways back.
 */
export const useArticleSearch = (query: string): ArticleSearchState => {
  const [search, setSearch] = useState<ArticleSearch | null>(null);
  const [failed, setFailed] = useState(false);
  const active = query.length > 0;
  const [searchedFor, setSearchedFor] = useState(active);

  // Clearing the query is one of the two accepted ways out of a failure. The
  // reset happens here rather than in an effect so the very next render is
  // already out of the error state, with no failing catalog in between.
  if (searchedFor !== active) {
    setSearchedFor(active);
    if (!active) {
      setFailed(false);
    }
  }

  useEffect(() => {
    if (!active || search !== null || failed) {
      return noCleanup;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const loaded = await loadArticleSearch();
        if (!cancelled) {
          setSearch(loaded);
        }
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [active, failed, search]);

  const retry = useCallback(() => {
    setFailed(false);
  }, []);

  if (failed) {
    return { results: NO_RESULTS, retry, status: "error" };
  }
  if (!active) {
    return { results: NO_RESULTS, retry, status: "idle" };
  }
  if (search === null) {
    return { results: NO_RESULTS, retry, status: "loading" };
  }

  return { results: search.search(query), retry, status: "ready" };
};
