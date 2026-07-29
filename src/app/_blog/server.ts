import { createArticleServer } from "@/modules/blog/articles";

import { ARTICLE_FIXED_DESTINATIONS } from "./article-destinations";

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
