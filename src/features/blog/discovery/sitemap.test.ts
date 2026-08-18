import { describe, expect, test } from "vite-plus/test";

import type { ArticleDiscoveryEntry } from "@/features/blog/articles/types";

import { createBlogSitemapEntries, getArticleLastModified } from "./sitemap";

const cover = { height: 630, src: "/cover.png", width: 1200 };

const article = (
  slug: string,
  publishedAt: string,
  updatedAt: string | null = null
): ArticleDiscoveryEntry => ({
  cover,
  description: `Description for ${slug}.`,
  href: `/blog/${slug}`,
  publishedAt,
  tags: [{ id: "nextjs", label: "Next.js" }],
  title: slug,
  updatedAt,
});

describe("Blog sitemap discovery", () => {
  test("publishes only Blog HTML destinations with grounded dates", () => {
    const entries = [
      article("older", "2025-01-10", "2025-02-10"),
      article("newer", "2026-03-20"),
    ];

    expect(createBlogSitemapEntries(entries)).toStrictEqual([
      {
        href: "/blog",
        lastModified: "2026-03-20",
      },
      {
        href: "/blog/older",
        lastModified: "2025-02-10",
      },
      {
        href: "/blog/newer",
        lastModified: "2026-03-20",
      },
    ]);
  });

  test("omits ungrounded dates for an empty Published corpus", () => {
    expect(createBlogSitemapEntries([])).toStrictEqual([{ href: "/blog" }]);
  });

  test("uses updates only when they are explicitly authored", () => {
    expect(getArticleLastModified(article("published", "2026-01-10"))).toBe(
      "2026-01-10"
    );
    expect(
      getArticleLastModified(article("updated", "2026-01-10", "2026-02-20"))
    ).toBe("2026-02-20");
  });
});
