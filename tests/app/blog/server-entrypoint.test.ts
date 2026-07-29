import { expectTypeOf, test } from "vite-plus/test";

import type {
  ArticleSummary,
  FixedArticleDestination,
  createArticleServer,
} from "@/modules/blog/articles";

test("app adapters configure the server-only Article entrypoint", () => {
  expectTypeOf<ArticleSummary["slug"]>().toEqualTypeOf<string>();
  expectTypeOf<typeof createArticleServer>()
    .parameter(0)
    .toEqualTypeOf<readonly FixedArticleDestination[]>();
});
