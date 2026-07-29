import { expectTypeOf, test } from "vite-plus/test";

import type {
  ArticleSearch,
  ArticleSearchResult,
  HighlightRange,
  loadArticleSearch,
} from "@/modules/blog/search";

test("exposes a client-safe search service without engine types", () => {
  expectTypeOf<
    typeof loadArticleSearch
  >().returns.resolves.toEqualTypeOf<ArticleSearch>();
  expectTypeOf<ArticleSearch["search"]>().returns.toEqualTypeOf<
    readonly ArticleSearchResult[]
  >();
  expectTypeOf<HighlightRange>().toEqualTypeOf<{
    readonly start: number;
    readonly end: number;
  }>();
});
