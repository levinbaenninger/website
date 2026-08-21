import type { Temporal } from "@js-temporal/polyfill";
import type { MDXContent } from "mdx/types";

import type { ArticleCompilationFacts } from "./facts";
import { validateArticleMetadata } from "./metadata";
import type { Tag } from "./tags";
import type {
  ArticleCover,
  ArticleDetail,
  ArticleDiscoveryEntry,
  ArticleNeighbourLink,
  ArticleOutlineHeading,
  ArticleReaderNavigation,
  ArticleRedirect,
  ArticleSearchDocument,
  ArticleSocialImage,
  ArticleSummary,
  ArticleTagFacet,
} from "./types";

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

interface CanonicalArticleBase {
  readonly slug: string;
  readonly href: `/blog/${string}`;
  readonly title: string;
  readonly description: string;
  readonly cover: ArticleCover;
  readonly tags: readonly Tag[];
  readonly Content: MDXContent;
  readonly articleFacts: ArticleCompilationFacts;
  readonly redirectFrom: readonly string[];
}

type CanonicalArticle = CanonicalArticleBase &
  (
    | {
        readonly status: "Draft";
        readonly publishedAt?: string;
        readonly updatedAt?: string;
      }
    | {
        readonly status: "Published";
        readonly publishedAt: string;
        readonly updatedAt?: string;
      }
  );

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
  readonly listArticles: (options?: {
    readonly tag?: string;
  }) => Promise<readonly ArticleSummary[]>;
  readonly findArticle: (slug: string) => Promise<ArticleDetail | null>;
  readonly listArticleTags: () => Promise<readonly ArticleTagFacet[]>;
  readonly findArticleRedirect: (
    slug: string
  ) => Promise<`/blog/${string}` | null>;
  readonly listArticleRedirects: () => Promise<readonly ArticleRedirect[]>;
  readonly listPublishedArticleDiscoveryEntries: () => Promise<
    readonly ArticleDiscoveryEntry[]
  >;
  readonly listArticleSearchDocuments: () => Promise<
    readonly ArticleSearchDocument[]
  >;
  readonly listArticleSocialImages: () => Promise<
    readonly ArticleSocialImage[]
  >;
  readonly findArticleSocialImage: (
    slug: string
  ) => Promise<ArticleSocialImage | null>;
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
  const shared = {
    slug: article.slug,
    href: article.href,
    title: article.title,
    description: article.description,
    cover: article.cover,
    tags: article.tags,
  };

  if (article.status === "Published") {
    return {
      ...shared,
      status: "published",
      publishedAt: article.publishedAt,
      updatedAt: article.updatedAt ?? null,
    };
  }

  return {
    ...shared,
    status: "draft",
    publishedAt: article.publishedAt ?? null,
    updatedAt: article.updatedAt ?? null,
  };
};

const toDiscoveryEntry = (
  article: CanonicalArticle & { readonly status: "Published" }
): ArticleDiscoveryEntry => ({
  href: article.href,
  title: article.title,
  description: article.description,
  cover: article.cover,
  tags: article.tags,
  publishedAt: article.publishedAt,
  updatedAt: article.updatedAt ?? null,
});

const toNeighbourLink = (
  article: CanonicalArticle | undefined
): ArticleNeighbourLink | null =>
  article === undefined ? null : { href: article.href, title: article.title };

/** Neighbours come from the visible collection so they match catalog order. A production Draft is not in the array, so it cannot become a neighbour. */
const toReaderNavigation = (
  articles: readonly CanonicalArticle[],
  index: number
): ArticleReaderNavigation => ({
  previous: toNeighbourLink(articles[index - 1]),
  next: toNeighbourLink(articles[index + 1]),
});

const toOutline = (
  article: CanonicalArticle
): readonly ArticleOutlineHeading[] =>
  article.articleFacts.headings.map(({ depth, id, text }) => ({
    depth,
    id,
    text,
  }));

const toDetail = (
  article: CanonicalArticle,
  navigation: ArticleReaderNavigation
): ArticleDetail => {
  const summary = toSummary(article);

  if (article.status === "Published" && summary.status === "published") {
    return {
      ...summary,
      Content: article.Content,
      discovery: toDiscoveryEntry(article),
      navigation,
      outline: toOutline(article),
    };
  }

  if (summary.status !== "draft") {
    throw new Error("Draft Article projection has an invalid status.");
  }

  return {
    ...summary,
    Content: article.Content,
    discovery: null,
    navigation,
    outline: toOutline(article),
  };
};

const toSearchDocument = (
  article: CanonicalArticle
): ArticleSearchDocument => ({
  id: article.slug,
  href: article.href,
  title: article.title,
  description: article.description,
  tags: article.tags,
  headings: article.articleFacts.headings.map(({ text }) => text),
  body: article.articleFacts.searchText,
  status: article.status === "Published" ? "published" : "draft",
});

const toSocialImage = (article: CanonicalArticle): ArticleSocialImage => ({
  alt: `${article.title}: Levin Bänninger`,
  label: "Article",
  slug: article.slug,
  title: article.title,
});

const assertHeadingFragmentExists = (
  fragment: string,
  headings: CanonicalArticle["articleFacts"]["headings"],
  slug: string
): void => {
  if (!headings.some(({ id }) => id === fragment)) {
    throw new Error(
      `Article link fragment ${JSON.stringify(fragment)} does not exist in ${JSON.stringify(slug)}.`
    );
  }
};

const parseCanonicalArticleHref = (
  href: string
): { readonly slug: string; readonly fragment?: string } | undefined => {
  if (!/^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*(?:#[^#]+)?$/u.test(href)) {
    return undefined;
  }
  const targetWithFragment = href.slice("/blog/".length);
  const fragmentIndex = targetWithFragment.indexOf("#");
  if (fragmentIndex === -1) {
    return { slug: targetWithFragment };
  }
  return {
    slug: targetWithFragment.slice(0, fragmentIndex),
    fragment: targetWithFragment.slice(fragmentIndex + 1),
  };
};

const validateCanonicalArticleLink = (
  article: CanonicalArticle,
  href: string,
  articlesBySlug: ReadonlyMap<string, CanonicalArticle>
): boolean => {
  const parsed = parseCanonicalArticleHref(href);
  if (parsed === undefined) {
    return false;
  }
  const target = articlesBySlug.get(parsed.slug);
  if (target === undefined) {
    throw new Error(
      `Article ${JSON.stringify(article.slug)} links to unknown canonical Article ${JSON.stringify(parsed.slug)}.`
    );
  }
  if (article.status === "Published" && target.status === "Draft") {
    throw new Error(
      `Published Article ${JSON.stringify(article.slug)} cannot link to Draft Article ${JSON.stringify(parsed.slug)}.`
    );
  }
  if (parsed.fragment !== undefined) {
    assertHeadingFragmentExists(
      parsed.fragment,
      target.articleFacts.headings,
      parsed.slug
    );
  }
  return true;
};

const validateFixedDestinationLink = (
  article: CanonicalArticle,
  href: string,
  fixedByPathname: ReadonlyMap<string, ReadonlySet<string>>
): void => {
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
      if (href.startsWith("#")) {
        assertHeadingFragmentExists(
          href.slice(1),
          article.articleFacts.headings,
          article.slug
        );
        continue;
      }
      if (href.startsWith("https://")) {
        continue;
      }
      if (validateCanonicalArticleLink(article, href, articlesBySlug)) {
        continue;
      }
      validateFixedDestinationLink(article, href, fixedByPathname);
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
    async listArticles(listOptions = {}) {
      const articles = await getVisibleArticles();
      const filteredArticles =
        listOptions.tag === undefined
          ? articles
          : articles.filter((article) =>
              article.tags.some(({ id }) => id === listOptions.tag)
            );
      return filteredArticles.map(toSummary);
    },
    async findArticle(slug) {
      const articles = await getVisibleArticles();
      const index = articles.findIndex((candidate) => candidate.slug === slug);
      const article = articles[index];
      return article === undefined
        ? null
        : toDetail(article, toReaderNavigation(articles, index));
    },
    async listArticleTags() {
      const articles = await getVisibleArticles();
      const facetsById = new Map<string, ArticleTagFacet>();

      for (const article of articles) {
        for (const tag of article.tags) {
          const existing = facetsById.get(tag.id);
          facetsById.set(tag.id, {
            ...tag,
            articleCount: (existing?.articleCount ?? 0) + 1,
          });
        }
      }

      return [...facetsById.values()].toSorted((left, right) =>
        compareSlugs(left.label, right.label)
      );
    },
    async findArticleRedirect(slug) {
      const articles = await getVisibleArticles();
      const article = articles.find((candidate) =>
        candidate.redirectFrom.includes(slug)
      );
      return article?.href ?? null;
    },
    async listArticleRedirects() {
      const articles = await getVisibleArticles();
      return articles
        .flatMap((article) =>
          article.redirectFrom.map((slug) => ({
            slug,
            href: article.href,
          }))
        )
        .toSorted((left, right) => compareSlugs(left.slug, right.slug));
    },
    async listPublishedArticleDiscoveryEntries() {
      const collection = await getCollection();
      return collection
        .filter(
          (
            article
          ): article is CanonicalArticle & { readonly status: "Published" } =>
            article.status === "Published"
        )
        .map(toDiscoveryEntry);
    },
    async listArticleSearchDocuments() {
      const articles = await getVisibleArticles();
      return articles
        .toSorted((left, right) => compareSlugs(left.slug, right.slug))
        .map(toSearchDocument);
    },
    async listArticleSocialImages() {
      const articles = await getVisibleArticles();
      return articles.map(toSocialImage);
    },
    async findArticleSocialImage(slug) {
      const articles = await getVisibleArticles();
      const article = articles.find((candidate) => candidate.slug === slug);
      return article === undefined ? null : toSocialImage(article);
    },
  };
};
