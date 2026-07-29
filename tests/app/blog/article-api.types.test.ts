import { expectTypeOf, test } from "vite-plus/test";

import type {
  ArticleSummary,
  FixedArticleDestination,
  createArticleServer,
} from "@/modules/blog/articles";

test("exposes the Article server API types used by app adapters", () => {
  expectTypeOf<ArticleSummary["slug"]>().toEqualTypeOf<string>();
  expectTypeOf<typeof createArticleServer>()
    .parameter(0)
    .toEqualTypeOf<readonly FixedArticleDestination[]>();
});
