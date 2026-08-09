import type { MetadataRoute } from "next";

import { toCanonicalUrl } from "@/app/_site/identity";
import type { ArticleDiscoveryEntry } from "@/features/blog/articles/types";

export const getArticleLastModified = (
  article: ArticleDiscoveryEntry
): string => article.updatedAt ?? article.publishedAt;

export const getLatestArticleDate = (
  articles: readonly ArticleDiscoveryEntry[]
): string | undefined => {
  let latest: string | undefined;

  for (const article of articles) {
    const articleDate = getArticleLastModified(article);
    if (latest === undefined || articleDate > latest) {
      latest = articleDate;
    }
  }

  return latest;
};

export const createSitemap = (
  articles: readonly ArticleDiscoveryEntry[]
): MetadataRoute.Sitemap => {
  const blogLastModified = getLatestArticleDate(articles);

  return [
    { url: toCanonicalUrl("/") },
    {
      url: toCanonicalUrl("/blog"),
      ...(blogLastModified === undefined
        ? {}
        : { lastModified: blogLastModified }),
    },
    ...articles.map((article) => ({
      url: toCanonicalUrl(article.href),
      lastModified: getArticleLastModified(article),
    })),
  ];
};

export const createRobotsPolicy = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: "*",
    allow: "/",
  },
  sitemap: toCanonicalUrl("/sitemap.xml"),
});
