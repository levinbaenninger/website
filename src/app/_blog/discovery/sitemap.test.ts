import { describe, expect, test } from "vite-plus/test";

import type { ArticleDiscoveryEntry } from "@/modules/blog/articles";

import {
  createRobotsPolicy,
  createSitemap,
  getArticleLastModified,
} from "./sitemap";

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

describe("crawler discovery adapters", () => {
  test("publishes only canonical HTML destinations with grounded dates", () => {
    const entries = [
      article("older", "2025-01-10", "2025-02-10"),
      article("newer", "2026-03-20"),
    ];

    expect(createSitemap(entries)).toEqual([
      { url: "https://levin.baenninger.me/" },
      {
        lastModified: "2026-03-20",
        url: "https://levin.baenninger.me/blog",
      },
      {
        lastModified: "2025-02-10",
        url: "https://levin.baenninger.me/blog/older",
      },
      {
        lastModified: "2026-03-20",
        url: "https://levin.baenninger.me/blog/newer",
      },
    ]);
  });

  test("omits ungrounded dates for an empty Published corpus", () => {
    expect(createSitemap([])).toEqual([
      { url: "https://levin.baenninger.me/" },
      { url: "https://levin.baenninger.me/blog" },
    ]);
  });

  test("uses updates only when they are explicitly authored", () => {
    expect(getArticleLastModified(article("published", "2026-01-10"))).toBe(
      "2026-01-10"
    );
    expect(
      getArticleLastModified(article("updated", "2026-01-10", "2026-02-20"))
    ).toBe("2026-02-20");
  });

  test("allows ordinary crawling and declares only the production sitemap", () => {
    expect(createRobotsPolicy()).toEqual({
      rules: { allow: "/", userAgent: "*" },
      sitemap: "https://levin.baenninger.me/sitemap.xml",
    });
  });
});
