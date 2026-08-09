import { describe, expect, test } from "vite-plus/test";

import {
  isEffectiveArticleSearchQuery,
  MAX_ARTICLE_SEARCH_QUERY_GRAPHEMES,
  normalizeArticleSearchQuery,
} from "./query";

const graphemes = (value: string): number =>
  [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(value)]
    .length;

describe("Article search query normalization", () => {
  test("composes decomposed text so both spellings of a word agree", () => {
    expect(normalizeArticleSearchQuery("Café")).toBe("Café");
  });

  test("collapses internal whitespace and drops leading whitespace", () => {
    expect(normalizeArticleSearchQuery("  cache \t\n components  ")).toBe(
      "cache components"
    );
  });

  test("keeps a single trailing space only while the field is being typed in", () => {
    expect(
      normalizeArticleSearchQuery("cache   ", { preserveTrailingSpace: true })
    ).toBe("cache ");
    expect(normalizeArticleSearchQuery("cache   ")).toBe("cache");
  });

  test("truncates an over-long value at a grapheme boundary", () => {
    const family = "👩‍👩‍👧‍👦";
    const pasted = family.repeat(MAX_ARTICLE_SEARCH_QUERY_GRAPHEMES + 20);
    const normalized = normalizeArticleSearchQuery(pasted);

    expect(graphemes(normalized)).toBe(MAX_ARTICLE_SEARCH_QUERY_GRAPHEMES);
    expect(normalized).toBe(family.repeat(MAX_ARTICLE_SEARCH_QUERY_GRAPHEMES));
    expect(normalized).not.toContain("�");
  });

  test("leaves a value that already fits untouched", () => {
    const query = "cache components";

    expect(normalizeArticleSearchQuery(query)).toBe(query);
  });

  test("treats a whitespace-only query as nothing to search for", () => {
    expect(isEffectiveArticleSearchQuery("   ")).toBe(false);
    expect(isEffectiveArticleSearchQuery("")).toBe(false);
    expect(isEffectiveArticleSearchQuery("c")).toBe(true);
    expect(isEffectiveArticleSearchQuery("cache ")).toBe(true);
  });
});
