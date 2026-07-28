import "server-only";
import { createArticleOperations } from "./article-collection";
import { ARTICLE_MANIFEST } from "./article-manifest.generated";
import { getZurichToday } from "./today";

const operations = createArticleOperations({
  manifest: ARTICLE_MANIFEST,
  includeDrafts: process.env.NODE_ENV === "development",
  today: getZurichToday(),
});

export const { findArticleBySlug, listArticles } = operations;
export type { ArticleDetail, ArticleSummary } from "./types";
