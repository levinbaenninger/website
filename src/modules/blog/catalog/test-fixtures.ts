// Catalog fixtures shared by the server and DOM tests for this directory.

import type {
  ArticleTagFacet,
  DraftArticleSummary,
  PublishedArticleSummary,
} from "@/modules/blog/articles/types";

const coverFor = (slug: string) => ({
  height: 630,
  src: `/covers/${slug}.png`,
  width: 1200,
});

export const publishedArticle = ({
  description = "A representative Article.",
  publishedAt = "2026-07-28",
  slug,
  title = `Article ${slug}`,
}: {
  description?: string;
  publishedAt?: string;
  slug: string;
  title?: string;
}): PublishedArticleSummary => ({
  cover: coverFor(slug),
  description,
  href: `/blog/${slug}`,
  publishedAt,
  slug,
  status: "published",
  tags: [],
  title,
  updatedAt: null,
});

export const draftArticle = ({
  publishedAt = null,
  slug,
  title = `Draft ${slug}`,
}: {
  publishedAt?: string | null;
  slug: string;
  title?: string;
}): DraftArticleSummary => ({
  cover: coverFor(slug),
  description: "An unfinished Article.",
  href: `/blog/${slug}`,
  publishedAt,
  slug,
  status: "draft",
  tags: [],
  title,
  updatedAt: null,
});

export const TAG_FACETS: readonly ArticleTagFacet[] = [
  { articleCount: 2, id: "nextjs", label: "Next.js" },
  { articleCount: 1, id: "web-performance", label: "Web performance" },
];
