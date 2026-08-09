import type { ArticleDiscoveryEntry } from "@/features/blog/articles/types";

export interface BlogSitemapEntry {
  readonly href: `/blog${string}`;
  readonly lastModified?: string;
}

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

export const createBlogSitemapEntries = (
  articles: readonly ArticleDiscoveryEntry[]
): BlogSitemapEntry[] => {
  const blogLastModified = getLatestArticleDate(articles);

  return [
    {
      href: "/blog",
      ...(blogLastModified === undefined
        ? {}
        : { lastModified: blogLastModified }),
    },
    ...articles.map((article) => ({
      href: article.href,
      lastModified: getArticleLastModified(article),
    })),
  ];
};
