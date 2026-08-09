import { expect, test } from "vite-plus/test";

import { createBlogCatalogMetadata } from "./metadata";

test("defines framework-neutral catalog metadata policy", () => {
  expect(createBlogCatalogMetadata("Example Author")).toEqual({
    canonicalHref: "/blog",
    description:
      "Writing about nerdy stuff—mostly software, the web, and whatever else catches my attention.",
    rss: {
      href: "/blog/rss.xml",
      mediaType: "application/rss+xml",
    },
    title: "Blog | Example Author",
  });
});
