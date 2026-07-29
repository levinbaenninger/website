"use client";

import { createArticleSearchLoader } from "./service";

const articleSearchLoader = createArticleSearchLoader({
  fetchArtifact: async (url) => await fetch(url),
  loadFuse: async () => await import("fuse.js"),
});

export const loadArticleSearch = articleSearchLoader.load;

export type {
  ArticleSearch,
  ArticleSearchResult,
  ArticleSearchSnippet,
  HighlightedText,
  HighlightRange,
} from "./service";
