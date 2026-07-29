import "server-only";
import { createArticleOperations } from "./article-collection";
import type { FixedArticleDestination } from "./article-collection";
import { ARTICLE_MANIFEST } from "./article-manifest.generated";
import { getZurichToday } from "./today";

export const createArticleServer = (
  fixedDestinations: readonly FixedArticleDestination[]
) =>
  createArticleOperations({
    fixedDestinations,
    manifest: ARTICLE_MANIFEST,
    includeDrafts: process.env.NODE_ENV === "development",
    today: getZurichToday(),
  });

export type { FixedArticleDestination } from "./article-collection";
export type {
  ArticleDetail,
  ArticleDiscoveryEntry,
  ArticleRedirect,
  ArticleSearchDocument,
  ArticleSummary,
  ArticleTagFacet,
} from "./types";
