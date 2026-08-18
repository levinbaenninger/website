import type { ArticleDiscoveryEntry } from "@/features/blog/articles/types";

export interface BlogSitemapEntry {
  readonly href: `/blog${string}`;
  readonly lastModified?: string;
}

// Mutable build type: optional fields are added as statements so an absent
// date stays absent instead of becoming an undefined-valued key.
interface BlogSitemapEntryDraft {
  href: BlogSitemapEntry["href"];
  lastModified?: string;
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
  const blogEntry: BlogSitemapEntryDraft = {
    href: "/blog",
  };
  if (blogLastModified !== undefined) {
    blogEntry.lastModified = blogLastModified;
  }

  return [
    blogEntry,
    ...articles.map((article) => ({
      href: article.href,
      lastModified: getArticleLastModified(article),
    })),
  ];
};
