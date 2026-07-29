import "server-only";
import { createArticleOperations } from "./collection";
import type { FixedArticleDestination } from "./collection";
import { ARTICLE_MANIFEST } from "./manifest.generated";
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

export { ArticleView } from "./view";
export type { FixedArticleDestination } from "./collection";
export type {
  ArticleDetail,
  ArticleDiscoveryEntry,
  ArticleRedirect,
  ArticleSearchDocument,
  ArticleSocialImage,
  ArticleSummary,
  ArticleTagFacet,
} from "./types";
