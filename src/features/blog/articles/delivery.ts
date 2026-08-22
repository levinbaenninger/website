import type { ArticleDetail, ArticleRedirect, ArticleSummary } from "./types";

const ARTICLE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export const isArticleSlug = (slug: string): boolean =>
  slug.length <= 80 && ARTICLE_SLUG_PATTERN.test(slug);

interface ArticleDeliverySource {
  readonly findArticle: (slug: string) => Promise<ArticleDetail | null>;
  readonly findArticleRedirect: (
    slug: string
  ) => Promise<`/blog/${string}` | null>;
  readonly listArticleRedirects: () => Promise<readonly ArticleRedirect[]>;
  readonly listArticles: () => Promise<readonly ArticleSummary[]>;
}

export type ArticleDeliveryResolution =
  | { readonly kind: "current"; readonly article: ArticleDetail }
  | { readonly kind: "redirect"; readonly destination: `/blog/${string}` }
  | { readonly kind: "not-found" };

export const createArticleDeliveryOperations = (
  source: ArticleDeliverySource
) => ({
  async generateStaticParams(): Promise<{ readonly slug: string }[]> {
    const [articles, redirects] = await Promise.all([
      source.listArticles(),
      source.listArticleRedirects(),
    ]);

    return [
      ...articles.map(({ slug }) => slug),
      ...redirects.map(({ slug }) => slug),
    ]
      .toSorted()
      .map((slug) => ({ slug }));
  },
  async resolve(slug: string): Promise<ArticleDeliveryResolution> {
    if (!isArticleSlug(slug)) {
      return { kind: "not-found" };
    }

    const article = await source.findArticle(slug);
    if (article !== null) {
      return { article, kind: "current" };
    }

    const destination = await source.findArticleRedirect(slug);
    return destination === null
      ? { kind: "not-found" }
      : { destination, kind: "redirect" };
  },
});
