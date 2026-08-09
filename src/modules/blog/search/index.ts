"use client";

import { createArticleSearchLoader } from "./service";

const articleSearchLoader = createArticleSearchLoader({
  fetchArtifact: async (url) => await fetch(url),
  loadFuse: async () => await import("fuse.js"),
});

export const loadArticleSearch = articleSearchLoader.load;

export {
  isEffectiveArticleSearchQuery,
  MAX_ARTICLE_SEARCH_QUERY_GRAPHEMES,
  normalizeArticleSearchQuery,
} from "./query";

export type {
  ArticleSearch,
  ArticleSearchResult,
  ArticleSearchSnippet,
  HighlightedText,
  HighlightRange,
} from "./service";
