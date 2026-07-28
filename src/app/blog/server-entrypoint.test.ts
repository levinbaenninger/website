import { expectTypeOf, test } from "vite-plus/test";

import type {
  ArticleSummary,
  FixedArticleDestination,
  createArticleServer,
} from "@/modules/blog/server";

test("app adapters configure the explicit Blog server entrypoint", () => {
  expectTypeOf<ArticleSummary["slug"]>().toEqualTypeOf<string>();
  expectTypeOf<typeof createArticleServer>()
    .parameter(0)
    .toEqualTypeOf<readonly FixedArticleDestination[]>();
});
