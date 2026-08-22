import { createArticleServer } from "@/features/blog/articles/server-api";

import { ARTICLE_FIXED_DESTINATIONS } from "./destinations";

export const {
  findArticleSocialImageInput,
  generateArticleStaticParams,
  listArticleSocialImageRouteParams,
  listArticleSearchDocuments,
  listArticleTags,
  listArticles,
  listPublishedArticleDiscoveryEntries,
  resolveArticleDelivery,
} = createArticleServer(ARTICLE_FIXED_DESTINATIONS);
