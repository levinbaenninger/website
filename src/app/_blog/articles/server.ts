import { createArticleServer } from "@/features/blog/articles/server-api";

import { ARTICLE_FIXED_DESTINATIONS } from "./destinations";

export const {
  findArticleSocialImage,
  findArticle,
  findArticleRedirect,
  listArticleRedirects,
  listArticleSearchDocuments,
  listArticleSocialImages,
  listArticleTags,
  listArticles,
  listPublishedArticleDiscoveryEntries,
} = createArticleServer(ARTICLE_FIXED_DESTINATIONS);
