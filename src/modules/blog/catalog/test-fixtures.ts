// Catalog fixtures shared by the server and DOM tests for this directory.

import type { Tag } from "@/modules/blog/articles/tags";
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
  tags = [],
  title = `Article ${slug}`,
}: {
  description?: string;
  publishedAt?: string;
  slug: string;
  tags?: readonly Tag[];
  title?: string;
}): PublishedArticleSummary => ({
  cover: coverFor(slug),
  description,
  href: `/blog/${slug}`,
  publishedAt,
  slug,
  status: "published",
  tags,
  title,
  updatedAt: null,
});

export const draftArticle = ({
  publishedAt = null,
  slug,
  tags = [],
  title = `Draft ${slug}`,
}: {
  publishedAt?: string | null;
  slug: string;
  tags?: readonly Tag[];
  title?: string;
}): DraftArticleSummary => ({
  cover: coverFor(slug),
  description: "An unfinished Article.",
  href: `/blog/${slug}`,
  publishedAt,
  slug,
  status: "draft",
  tags,
  title,
  updatedAt: null,
});

export const NEXTJS: Tag = { id: "nextjs", label: "Next.js" };
export const WEB_PERFORMANCE: Tag = {
  id: "web-performance",
  label: "Web performance",
};

export const TAG_FACETS: readonly ArticleTagFacet[] = [
  { ...NEXTJS, articleCount: 2 },
  { ...WEB_PERFORMANCE, articleCount: 1 },
];
