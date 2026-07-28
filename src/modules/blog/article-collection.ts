import type { Temporal } from "@js-temporal/polyfill";
import type { MDXContent } from "mdx/types";

import { validateArticleMetadata } from "./metadata";
import type { ArticleCover, ArticleDetail, ArticleSummary } from "./types";

interface ArticleModule {
  readonly default: MDXContent;
  readonly frontmatter: unknown;
}

export interface ArticleManifestEntry {
  readonly slug: string;
  readonly cover: ArticleCover;
  readonly loadArticle: () => Promise<ArticleModule>;
}

type CanonicalArticle = ArticleDetail & {
  readonly redirectFrom: readonly string[];
};

interface ArticleOperationsOptions {
  readonly manifest: readonly ArticleManifestEntry[];
  readonly includeDrafts: boolean;
  readonly today: Temporal.PlainDate;
}

export interface ArticleOperations {
  readonly listArticles: () => Promise<readonly ArticleSummary[]>;
  readonly findArticleBySlug: (slug: string) => Promise<ArticleDetail | null>;
}

const compareSlugs = (left: string, right: string): number => {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
};

const compareArticles = (
  left: CanonicalArticle,
  right: CanonicalArticle
): number => {
  if (left.status === "Draft" && right.status === "Published") {
    return -1;
  }

  if (left.status === "Published" && right.status === "Draft") {
    return 1;
  }

  if (left.status === "Published" && right.status === "Published") {
    const dateOrder = right.publishedAt.localeCompare(left.publishedAt);

    if (dateOrder !== 0) {
      return dateOrder;
    }
  }

  return compareSlugs(left.slug, right.slug);
};

const toSummary = (article: CanonicalArticle): ArticleSummary => {
  const {
    Content: _Content,
    redirectFrom: _redirectFrom,
    ...summary
  } = article;
  return summary;
};

const toDetail = (article: CanonicalArticle): ArticleDetail => {
  const { redirectFrom: _redirectFrom, ...detail } = article;
  return detail;
};

const buildCollection = async ({
  manifest,
  today,
}: Pick<ArticleOperationsOptions, "manifest" | "today">): Promise<
  readonly CanonicalArticle[]
> => {
  const loadedArticles = await Promise.all(
    manifest.map(async ({ slug, cover, loadArticle }) => {
      const articleModule = await loadArticle();
      const metadata = validateArticleMetadata(articleModule.frontmatter, {
        slug,
        today,
      });

      return {
        slug,
        href: `/blog/${slug}` as const,
        cover,
        Content: articleModule.default,
        ...metadata,
      };
    })
  );

  const claimedSlugs = new Set<string>();

  for (const article of loadedArticles) {
    for (const slug of [article.slug, ...article.redirectFrom]) {
      if (claimedSlugs.has(slug)) {
        throw new Error(
          `Article slug or redirect collision: ${JSON.stringify(slug)}`
        );
      }
      claimedSlugs.add(slug);
    }
  }

  return loadedArticles.toSorted(compareArticles);
};

export const createArticleOperations = (
  options: ArticleOperationsOptions
): ArticleOperations => {
  let collectionPromise: Promise<readonly CanonicalArticle[]> | undefined;

  const buildCollectionWithRecovery = async (): Promise<
    readonly CanonicalArticle[]
  > => {
    try {
      return await buildCollection(options);
    } catch (error) {
      collectionPromise = undefined;
      throw error;
    }
  };

  const getCollection = async (): Promise<readonly CanonicalArticle[]> => {
    collectionPromise ??= buildCollectionWithRecovery();
    return await collectionPromise;
  };

  const getVisibleArticles = async (): Promise<readonly CanonicalArticle[]> => {
    const collection = await getCollection();
    return options.includeDrafts
      ? collection
      : collection.filter((article) => article.status === "Published");
  };

  return {
    async listArticles() {
      const articles = await getVisibleArticles();
      return articles.map(toSummary);
    },
    async findArticleBySlug(slug) {
      const articles = await getVisibleArticles();
      const article = articles.find((candidate) => candidate.slug === slug);
      return article === undefined ? null : toDetail(article);
    },
  };
};
