import type {
  ArticleDetail,
  ArticleRedirect,
  ArticleSummary,
} from "@/features/blog/articles/types";

const ARTICLE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export const isArticleSlug = (slug: string): boolean =>
  slug.length <= 80 && ARTICLE_SLUG_PATTERN.test(slug);

interface ArticleRouteOperations {
  readonly findArticle: (slug: string) => Promise<ArticleDetail | null>;
  readonly findArticleRedirect: (
    slug: string
  ) => Promise<`/blog/${string}` | null>;
  readonly listArticleRedirects: () => Promise<readonly ArticleRedirect[]>;
  readonly listArticles: () => Promise<readonly ArticleSummary[]>;
}

export type ArticleRouteResolution =
  | { readonly kind: "current"; readonly article: ArticleDetail }
  | { readonly kind: "redirect"; readonly destination: `/blog/${string}` }
  | { readonly kind: "not-found" };

export const createArticleRouteContract = (
  operations: ArticleRouteOperations
) => ({
  async generateStaticParams(): Promise<{ readonly slug: string }[]> {
    const [articles, redirects] = await Promise.all([
      operations.listArticles(),
      operations.listArticleRedirects(),
    ]);

    return [
      ...articles.map(({ slug }) => slug),
      ...redirects.map(({ slug }) => slug),
    ]
      .toSorted()
      .map((slug) => ({ slug }));
  },
  async resolve(slug: string): Promise<ArticleRouteResolution> {
    if (!isArticleSlug(slug)) {
      return { kind: "not-found" };
    }

    const article = await operations.findArticle(slug);
    if (article !== null) {
      return { article, kind: "current" };
    }

    const destination = await operations.findArticleRedirect(slug);
    return destination === null
      ? { kind: "not-found" }
      : { destination, kind: "redirect" };
  },
});

interface NavigationOperations {
  readonly notFound: () => never;
  readonly permanentRedirect: (
    destination: `/blog/${string}`,
    type: "replace"
  ) => never;
}

export const requireCurrentArticle = (
  resolution: ArticleRouteResolution,
  navigation: NavigationOperations
): ArticleDetail => {
  if (resolution.kind === "redirect") {
    navigation.permanentRedirect(resolution.destination, "replace");
  }

  if (resolution.kind === "not-found") {
    navigation.notFound();
  }

  return resolution.article;
};
