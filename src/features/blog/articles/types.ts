import type { MDXContent } from "mdx/types";

import type { Tag } from "./tags";

export interface ArticleCover {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly blurDataURL?: string;
  readonly blurWidth?: number;
  readonly blurHeight?: number;
}

interface ArticleSummaryBase {
  readonly slug: string;
  readonly href: `/blog/${string}`;
  readonly title: string;
  readonly description: string;
  readonly cover: ArticleCover;
  readonly tags: readonly Tag[];
}

export type DraftArticleSummary = ArticleSummaryBase & {
  readonly status: "draft";
  readonly publishedAt: string | null;
  readonly updatedAt: string | null;
};

export type PublishedArticleSummary = ArticleSummaryBase & {
  readonly status: "published";
  readonly publishedAt: string;
  readonly updatedAt: string | null;
};

export type ArticleSummary = DraftArticleSummary | PublishedArticleSummary;

export interface ArticleTagFacet extends Tag {
  readonly articleCount: number;
}

export interface ArticleRedirect {
  readonly slug: string;
  readonly href: `/blog/${string}`;
}

export interface ArticleDiscoveryEntry {
  readonly href: `/blog/${string}`;
  readonly title: string;
  readonly description: string;
  readonly cover: ArticleCover;
  readonly tags: readonly Tag[];
  readonly publishedAt: string;
  readonly updatedAt: string | null;
}

/** Not an `ArticleSummary`: a wider projection would invite Cover, dates, and Draft state of an Article the visitor is not reading. */
export interface ArticleNeighbourLink {
  readonly href: `/blog/${string}`;
  readonly title: string;
}

export interface ArticleReaderNavigation {
  readonly previous: ArticleNeighbourLink | null;
  readonly next: ArticleNeighbourLink | null;
}

export interface ArticleOutlineHeading {
  readonly depth: 2 | 3 | 4;
  readonly id: string;
  readonly text: string;
}

interface ArticleDetailBase {
  readonly Content: MDXContent;
  readonly navigation: ArticleReaderNavigation;
  readonly outline: readonly ArticleOutlineHeading[];
}

export type DraftArticleDetail = DraftArticleSummary &
  ArticleDetailBase & {
    readonly discovery: null;
  };

export type PublishedArticleDetail = PublishedArticleSummary &
  ArticleDetailBase & {
    readonly discovery: ArticleDiscoveryEntry;
  };

export type ArticleDetail = DraftArticleDetail | PublishedArticleDetail;

export interface ArticleSearchDocument {
  readonly id: string;
  readonly href: `/blog/${string}`;
  readonly title: string;
  readonly description: string;
  readonly tags: readonly Tag[];
  readonly headings: readonly string[];
  readonly body: string;
  readonly status: "published" | "draft";
}

export interface ArticleSocialImage {
  readonly alt: string;
  readonly label: "Article";
  readonly slug: string;
  readonly title: string;
}
