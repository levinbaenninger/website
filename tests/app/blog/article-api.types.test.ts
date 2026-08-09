import { expectTypeOf, test } from "vite-plus/test";

import type { FixedArticleDestination } from "@/features/blog/articles/collection";
import type { createArticleServer } from "@/features/blog/articles/server-api";
import type { ArticleSummary } from "@/features/blog/articles/types";

test("exposes the Article server API types used by app adapters", () => {
  expectTypeOf<ArticleSummary["slug"]>().toEqualTypeOf<string>();
  expectTypeOf<typeof createArticleServer>()
    .parameter(0)
    .toEqualTypeOf<readonly FixedArticleDestination[]>();
});
