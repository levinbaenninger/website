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

/**
 * One neighbouring Article, reduced to what the reader is allowed to render.
 *
 * Deliberately not an `ArticleSummary`: the reader shows a destination and a
 * title, and a wider projection would invite the Cover, dates, and Draft state
 * of an Article the visitor is not reading.
 */
export interface ArticleNeighbourLink {
  readonly href: `/blog/${string}`;
  readonly title: string;
}

/**
 * The neighbours of an Article in the exact order visitors see in the catalog.
 * Either side is `null` at a boundary: the collection does not wrap.
 */
export interface ArticleReaderNavigation {
  readonly previous: ArticleNeighbourLink | null;
  readonly next: ArticleNeighbourLink | null;
}

/**
 * One heading of the Article outline.
 *
 * The compiler is the only source of both fields: `id` is the ID it wrote onto
 * the rendered heading, and `text` is the plain text it extracted before the
 * heading became markup. The reader never scrapes the DOM to rebuild either.
 */
export interface ArticleOutlineHeading {
  readonly depth: 2 | 3 | 4;
  readonly id: string;
  readonly text: string;
}

interface ArticleDetailBase {
  readonly Content: MDXContent;
  readonly navigation: ArticleReaderNavigation;
  /**
   * The complete ordered structure of authored Article headings.
   *
   * Document order, and the same shape whatever a Tab or an Accordion is doing:
   * a heading inside a closed panel is part of the Article whether or not it is
   * on screen. It is a projection of compilation facts rather than the facts
   * themselves — links, search text and the rest stay private to the module.
   */
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
