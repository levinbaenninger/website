import { expectTypeOf, test } from "vite-plus/test";

import type { ArticleSummary } from "@/modules/blog/server";

test("app adapters can consume the explicit Blog server entrypoint", () => {
  expectTypeOf<ArticleSummary["slug"]>().toEqualTypeOf<string>();
});
