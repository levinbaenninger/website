import { beforeEach, expect, test, vi } from "vite-plus/test";

import type { ArticleDiscoveryEntry } from "@/features/blog/articles/types";

const { listPublishedArticleDiscoveryEntries } = vi.hoisted(() => ({
  listPublishedArticleDiscoveryEntries:
    vi.fn<() => Promise<readonly ArticleDiscoveryEntry[]>>(),
}));

vi.mock(import("@/app/blog/_articles/server"), () => ({
  listPublishedArticleDiscoveryEntries,
}));

beforeEach(() => {
  listPublishedArticleDiscoveryEntries.mockReset();
});

test("maps Published Blog discovery into the production sitemap", async () => {
  listPublishedArticleDiscoveryEntries.mockResolvedValue([
    {
      cover: { height: 630, src: "/cover.png", width: 1200 },
      description: "A Published Article.",
      href: "/blog/published",
      publishedAt: "2026-07-20",
      tags: [{ id: "nextjs", label: "Next.js" }],
      title: "Published",
      updatedAt: null,
    },
  ]);
  const { default: sitemap } = await import("./sitemap");

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

test("keeps an empty Published corpus date-free", async () => {
  listPublishedArticleDiscoveryEntries.mockResolvedValue([]);
  const { default: sitemap } = await import("./sitemap");

  await expect(sitemap()).resolves.toEqual([
    { url: "https://levin.baenninger.me/" },
    { url: "https://levin.baenninger.me/blog" },
  ]);
});
