// PROTOTYPE — throwaway. Delete this directory once issue #32 is decided.
//
// Real Fuse, real highlight ranges, real snippet cropping — the production
// search service with a fixture artifact injected instead of /blog/search.json.
// The `state` param forces the states a fixture loader would otherwise resolve
// past instantly (loading, error, no results, zero Articles).

"use client";

import { useEffect, useState } from "react";

import type { ArticleSummary } from "@/modules/blog/articles/types";
import type { ArticleSearchResult } from "@/modules/blog/search";
import { createArticleSearchArtifact } from "@/modules/blog/search/contract";
import { createArticleSearchLoader } from "@/modules/blog/search/service";

import { PROTOTYPE_ARTICLES, PROTOTYPE_SEARCH_DOCUMENTS } from "./fixtures";
import type { PrototypeState } from "./params";

const FORCED_QUERY: Partial<Record<PrototypeState, string>> = {
  loading: "cache",
  error: "cache",
  "no-results": "kubernetes",
};

const loader = createArticleSearchLoader({
  fetchArtifact: async () =>
    await Promise.resolve(
      Response.json(createArticleSearchArtifact(PROTOTYPE_SEARCH_DOCUMENTS))
    ),
  loadFuse: async () => await import("fuse.js"),
});

export type SearchStatus = "idle" | "loading" | "ready" | "error";

export interface PrototypeCatalog {
  readonly articles: readonly ArticleSummary[];
  readonly query: string;
  readonly results: readonly ArticleSearchResult[];
  readonly setQuery: (query: string) => void;
  readonly status: SearchStatus;
}

export const usePrototypeCatalog = (
  state: PrototypeState
): PrototypeCatalog => {
  const [query, setQuery] = useState(FORCED_QUERY[state] ?? "");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [results, setResults] = useState<readonly ArticleSearchResult[]>([]);
  const [renderedState, setRenderedState] = useState(state);

  // The switcher swaps ?state= without remounting, so reset the query the way a
  // fresh visit would: forced states need a query to have anything to show.
  if (renderedState !== state) {
    setRenderedState(state);
    setQuery(FORCED_QUERY[state] ?? "");
  }

  useEffect(() => {
    let cancelled = false;
    const trimmed = query.trim();

    const run = async () => {
      if (trimmed.length === 0) {
        setStatus("idle");
        setResults([]);
        return;
      }

      setStatus("loading");
      // Forced states are UI simulations, not real loader failures: the fixture
      // artifact resolves instantly, so these two states would never be seen.
      if (state === "loading") {
        return;
      }
      if (state === "error") {
        setResults([]);
        setStatus("error");
        return;
      }

      try {
        const search = await loader.load();
        if (!cancelled) {
          setResults(search.search(trimmed));
          setStatus("ready");
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setStatus("error");
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [query, state]);

  return {
    articles: state === "zero" ? [] : PROTOTYPE_ARTICLES,
    query,
    results,
    setQuery,
    status,
  };
};
