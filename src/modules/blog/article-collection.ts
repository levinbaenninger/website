import type { Temporal } from "@js-temporal/polyfill";
import type { MDXContent } from "mdx/types";

import type { ArticleCompilationFacts } from "./article-facts";
import { validateArticleMetadata } from "./metadata";
import type { ArticleCover, ArticleDetail, ArticleSummary } from "./types";

interface ArticleModule {
  readonly __articleFacts: ArticleCompilationFacts;
  readonly default: MDXContent;
  readonly frontmatter: unknown;
}

export interface ArticleManifestEntry {
  readonly slug: string;
  readonly cover: ArticleCover;
  readonly loadArticle: () => Promise<ArticleModule>;
}

type CanonicalArticle = ArticleDetail & {
  readonly articleFacts: ArticleCompilationFacts;
  readonly redirectFrom: readonly string[];
};

export interface FixedArticleDestination {
  readonly pathname: `/${string}`;
  readonly fragments: readonly string[];
}

interface ArticleOperationsOptions {
  readonly fixedDestinations?: readonly FixedArticleDestination[];
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
    articleFacts: _articleFacts,
    redirectFrom: _redirectFrom,
    ...summary
  } = article;
  return summary;
};

const toDetail = (article: CanonicalArticle): ArticleDetail => {
  const {
    articleFacts: _articleFacts,
    redirectFrom: _redirectFrom,
    ...detail
  } = article;
  return detail;
};

const validateCollectionLinks = (
  articles: readonly CanonicalArticle[],
  fixedDestinations: readonly FixedArticleDestination[]
): void => {
  const articlesBySlug = new Map(
    articles.map((article) => [article.slug, article])
  );
  const fixedByPathname = new Map<string, Set<string>>(
    fixedDestinations.map(({ pathname, fragments }) => [
      pathname,
      new Set(fragments),
    ])
  );

  for (const article of articles) {
    for (const { href } of article.articleFacts.links) {
      if (href.startsWith("#") || href.startsWith("https://")) {
        continue;
      }

      const isArticleLink =
        /^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*(?:#[^#]+)?$/u.test(href);
      if (isArticleLink) {
        const targetWithFragment = href.slice("/blog/".length);
        const fragmentIndex = targetWithFragment.indexOf("#");
        const targetSlug =
          fragmentIndex === -1
            ? targetWithFragment
            : targetWithFragment.slice(0, fragmentIndex);
        const fragment =
          fragmentIndex === -1
            ? undefined
            : targetWithFragment.slice(fragmentIndex + 1);
        const target = articlesBySlug.get(targetSlug);
        if (target === undefined) {
          throw new Error(
            `Article ${JSON.stringify(article.slug)} links to unknown canonical Article ${JSON.stringify(targetSlug)}.`
          );
        }
        if (article.status === "Published" && target.status === "Draft") {
          throw new Error(
            `Published Article ${JSON.stringify(article.slug)} cannot link to Draft Article ${JSON.stringify(targetSlug)}.`
          );
        }
        if (
          fragment !== undefined &&
          !target.articleFacts.headings.some(({ id }) => id === fragment)
        ) {
          throw new Error(
            `Article link fragment ${JSON.stringify(fragment)} does not exist in ${JSON.stringify(targetSlug)}.`
          );
        }
        continue;
      }

      const hashIndex = href.indexOf("#");
      const pathname = hashIndex === -1 ? href : href.slice(0, hashIndex);
      const fragment = hashIndex === -1 ? undefined : href.slice(hashIndex + 1);
      const allowedFragments = fixedByPathname.get(pathname);
      if (allowedFragments === undefined) {
        throw new Error(
          `Article ${JSON.stringify(article.slug)} links to unknown fixed app destination ${JSON.stringify(pathname)}.`
        );
      }
      if (fragment !== undefined && !allowedFragments.has(fragment)) {
        throw new Error(
          `Fixed app destination fragment ${JSON.stringify(fragment)} is not allowed for ${JSON.stringify(pathname)}.`
        );
      }
    }
  }
};

const buildCollection = async ({
  fixedDestinations = [],
  manifest,
  today,
}: Pick<
  ArticleOperationsOptions,
  "fixedDestinations" | "manifest" | "today"
>): Promise<readonly CanonicalArticle[]> => {
  const loadedArticles = await Promise.all(
    manifest.map(async ({ slug, cover, loadArticle }) => {
      const articleModule = await loadArticle();
      const metadata = validateArticleMetadata(articleModule.frontmatter, {
        slug,
        today,
      });

      return {
        articleFacts: articleModule.__articleFacts,
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

  validateCollectionLinks(loadedArticles, fixedDestinations);
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
