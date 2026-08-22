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
  // Nothing was scheduled.
};

export interface ArticleSearchState {
  readonly results: readonly ArticleSearchResult[];
  readonly retry: () => void;
  readonly status: ArticleSearchStatus;
}

export const useArticleSearch = (query: string): ArticleSearchState => {
  const [search, setSearch] = useState<ArticleSearch | null>(null);
  const [failed, setFailed] = useState(false);
  const active = query.length > 0;
  const [searchedFor, setSearchedFor] = useState(active);

  // Reset failure in render, not an effect, so the next paint is already out of the error state.
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
