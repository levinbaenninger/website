import { DOMParser } from "@xmldom/xmldom";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";

import type { ArticleDiscoveryEntry } from "@/features/blog/articles/types";

const { listPublishedArticleDiscoveryEntries } = vi.hoisted(() => ({
  listPublishedArticleDiscoveryEntries:
    vi.fn<() => Promise<readonly ArticleDiscoveryEntry[]>>(),
}));

vi.mock(import("@/app/blog/_articles/server"), () => ({
  listPublishedArticleDiscoveryEntries,
}));

const publishedArticle = {
  cover: { height: 630, src: "/cover.png", width: 1200 },
  description: "A Published Article.",
  href: "/blog/published",
  publishedAt: "2026-07-20",
  tags: [{ id: "nextjs", label: "Next.js" }],
  title: "Published",
  updatedAt: null,
} as const satisfies ArticleDiscoveryEntry;

describe("RSS Route Handler", () => {
  beforeEach(() => {
    listPublishedArticleDiscoveryEntries.mockReset();
    listPublishedArticleDiscoveryEntries.mockResolvedValue([publishedArticle]);
  });

  test("serves Published discovery as a force-static RSS response", async () => {
    const route = await import("./route");

    expect(route.dynamic).toBe("force-static");
    expect(route.GET).toHaveLength(0);

    const response = await route.GET();
    expect(response.headers.get("content-type")).toBe(
      "application/rss+xml; charset=utf-8"
    );
    expect(response.headers.get("x-robots-tag")).toBe("noindex, follow");
    const document = new DOMParser().parseFromString(
      await response.text(),
      "application/xml"
    );
    expect(document.getElementsByTagNameNS("*", "item")).toHaveLength(1);
    expect(listPublishedArticleDiscoveryEntries).toHaveBeenCalledOnce();
  });

  test("keeps an empty Published corpus valid and date-free", async () => {
    listPublishedArticleDiscoveryEntries.mockResolvedValue([]);
    const { GET } = await import("./route");
    const response = await GET();
    const document = new DOMParser().parseFromString(
      await response.text(),
      "application/xml"
    );

    expect(document.getElementsByTagNameNS("*", "item")).toHaveLength(0);
    expect(document.getElementsByTagNameNS("*", "lastBuildDate")).toHaveLength(
      0
    );
  });
});
