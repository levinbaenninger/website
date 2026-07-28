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
  readonly status: "Draft";
  readonly publishedAt?: string;
  readonly updatedAt?: string;
};

export type PublishedArticleSummary = ArticleSummaryBase & {
  readonly status: "Published";
  readonly publishedAt: string;
  readonly updatedAt?: string;
};

export type ArticleSummary = DraftArticleSummary | PublishedArticleSummary;

export type ArticleDetail = ArticleSummary & {
  readonly Content: MDXContent;
};
