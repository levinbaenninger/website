import { DOMParser } from "@xmldom/xmldom";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";

import type { ArticleDiscoveryEntry } from "@/modules/blog/articles";

const listPublishedArticleDiscoveryEntries =
  vi.fn<() => Promise<readonly ArticleDiscoveryEntry[]>>();

vi.mock("@/app/_blog/articles/server", () => ({
  listPublishedArticleDiscoveryEntries,
}));

const cover = { height: 630, src: "/cover.png", width: 1200 };
const publishedArticle = {
  cover,
  description: "A Published Article.",
  href: "/blog/published",
  publishedAt: "2026-07-20",
  tags: [{ id: "nextjs", label: "Next.js" }],
  title: "Published",
  updatedAt: null,
} as const satisfies ArticleDiscoveryEntry;

describe("discovery framework routes", () => {
  beforeEach(() => {
    listPublishedArticleDiscoveryEntries.mockReset();
    listPublishedArticleDiscoveryEntries.mockResolvedValue([publishedArticle]);
  });

  test("generates the sitemap from only the Published discovery operation", async () => {
    const { default: sitemap } = await import("@/app/sitemap");

    await expect(sitemap()).resolves.toEqual([
      { url: "https://levin.baenninger.me/" },
      {
        lastModified: "2026-07-20",
        url: "https://levin.baenninger.me/blog",
      },
      {
        lastModified: "2026-07-20",
        url: "https://levin.baenninger.me/blog/published",
      },
    ]);
    expect(listPublishedArticleDiscoveryEntries).toHaveBeenCalledOnce();
  });

  test("keeps the RSS handler request-independent and force-static", async () => {
    const route = await import("@/app/blog/rss.xml/route");

    expect(route.dynamic).toBe("force-static");
    expect(route.GET).toHaveLength(0);

    const first = await route.GET();
    const second = await route.GET();
    expect(first.headers.get("content-type")).toBe(
      "application/rss+xml; charset=utf-8"
    );
    expect(first.headers.get("x-robots-tag")).toBe("noindex, follow");
    const firstBody = await first.text();
    expect(firstBody).toBe(await second.text());
    const document = new DOMParser().parseFromString(
      firstBody,
      "application/xml"
    );
    expect(document.getElementsByTagNameNS("*", "item")).toHaveLength(1);
    expect(listPublishedArticleDiscoveryEntries).toHaveBeenCalledTimes(2);
  });

  test("keeps empty and Draft-only public projections valid and date-free", async () => {
    listPublishedArticleDiscoveryEntries.mockResolvedValue([]);
    const [{ default: sitemap }, route] = await Promise.all([
      import("@/app/sitemap"),
      import("@/app/blog/rss.xml/route"),
    ]);

    await expect(sitemap()).resolves.toEqual([
      { url: "https://levin.baenninger.me/" },
      { url: "https://levin.baenninger.me/blog" },
    ]);
    const response = await route.GET();
    const document = new DOMParser().parseFromString(
      await response.text(),
      "application/xml"
    );
    expect(document.getElementsByTagNameNS("*", "item")).toHaveLength(0);
    expect(document.getElementsByTagNameNS("*", "lastBuildDate")).toHaveLength(
      0
    );
  });

  test("serves the exact production robots policy", async () => {
    const { default: robots } = await import("@/app/robots");

    expect(robots()).toEqual({
      rules: { allow: "/", userAgent: "*" },
      sitemap: "https://levin.baenninger.me/sitemap.xml",
    });
  });
});
