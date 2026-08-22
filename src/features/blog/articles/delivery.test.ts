import { describe, expect, test, vi } from "vite-plus/test";

import { createArticleDeliveryOperations } from "@/features/blog/articles/delivery";
import type {
  ArticleDetail,
  ArticleRedirect,
  ArticleSummary,
} from "@/features/blog/articles/types";

const Content = () => null;
const cover = { height: 1, src: "/cover.png", width: 1 };
const currentArticle = {
  Content,
  cover,
  description: "Current Article description.",
  discovery: {
    cover,
    description: "Current Article description.",
    href: "/blog/current-article",
    publishedAt: "2026-07-20",
    tags: [{ id: "nextjs", label: "Next.js" }],
    title: "Current Article",
    updatedAt: null,
  },
  href: "/blog/current-article",
  publishedAt: "2026-07-20",
  slug: "current-article",
  status: "published",
  tags: [{ id: "nextjs", label: "Next.js" }],
  title: "Current Article",
  updatedAt: null,
  navigation: { next: null, previous: null },
  outline: [],
} as const satisfies ArticleDetail;

const createOperations = ({
  articles = [currentArticle],
  redirects = [{ href: currentArticle.href, slug: "former-article" }],
}: {
  articles?: readonly ArticleSummary[];
  redirects?: readonly ArticleRedirect[];
} = {}) => ({
  findArticle: vi.fn(async (slug: string) => {
    await Promise.resolve();
    return slug === currentArticle.slug ? currentArticle : null;
  }),
  findArticleRedirect: vi.fn(async (slug: string) => {
    await Promise.resolve();
    return redirects.find((redirect) => redirect.slug === slug)?.href ?? null;
  }),
  listArticleRedirects: vi.fn(async () => {
    await Promise.resolve();
    return redirects;
  }),
  listArticles: vi.fn(async () => {
    await Promise.resolve();
    return articles;
  }),
});

describe("Article route contract", () => {
  test("generates every visible current and former slug deterministically", async () => {
    const operations = createOperations({
      articles: [currentArticle],
      redirects: [
        { href: currentArticle.href, slug: "z-former" },
        { href: currentArticle.href, slug: "a-former" },
      ],
    });
    const route = createArticleDeliveryOperations(operations);

    await expect(route.generateStaticParams()).resolves.toStrictEqual([
      { slug: "a-former" },
      { slug: "current-article" },
      { slug: "z-former" },
    ]);
  });

  test("accepts a valid empty visible corpus", async () => {
    const route = createArticleDeliveryOperations(
      createOperations({ articles: [], redirects: [] })
    );

    await expect(route.generateStaticParams()).resolves.toStrictEqual([]);
  });

  test("distinguishes current, direct redirect, and unknown outcomes", async () => {
    const route = createArticleDeliveryOperations(createOperations());

    await expect(route.resolve("current-article")).resolves.toStrictEqual({
      article: currentArticle,
      kind: "current",
    });
    await expect(route.resolve("former-article")).resolves.toStrictEqual({
      destination: "/blog/current-article",
      kind: "redirect",
    });
    await expect(route.resolve("unknown")).resolves.toStrictEqual({
      kind: "not-found",
    });
  });

  test("rejects malformed slugs without querying Blog operations", async () => {
    const operations = createOperations();
    const route = createArticleDeliveryOperations(operations);

    await expect(route.resolve("Bad/Slug")).resolves.toStrictEqual({
      kind: "not-found",
    });
    expect(operations.findArticle).not.toHaveBeenCalled();
    expect(operations.findArticleRedirect).not.toHaveBeenCalled();
  });

  test("treats production-hidden current and former Draft slugs as not found", async () => {
    const operations = createOperations();
    operations.findArticle.mockResolvedValue(null);
    operations.findArticleRedirect.mockResolvedValue(null);
    const route = createArticleDeliveryOperations(operations);

    await expect(route.resolve("draft-sentinel")).resolves.toStrictEqual({
      kind: "not-found",
    });
    await expect(route.resolve("draft-sentinel-former")).resolves.toStrictEqual(
      {
        kind: "not-found",
      }
    );
  });
});
