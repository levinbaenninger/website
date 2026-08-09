import { expectTypeOf, test } from "vite-plus/test";

import type { loadArticleSearch } from "@/features/blog/search/loader";
import type {
  ArticleSearch,
  ArticleSearchResult,
  HighlightRange,
} from "@/features/blog/search/service";

test("exposes the client search API without engine types", () => {
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
