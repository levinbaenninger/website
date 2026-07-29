import { createArticleServer } from "@/modules/blog/articles";

import { ARTICLE_FIXED_DESTINATIONS } from "./article-destinations";

export const {
  findArticle,
  findArticleRedirect,
  listArticleRedirects,
  listArticleSearchDocuments,
  listArticleTags,
  listArticles,
  listPublishedArticleDiscoveryEntries,
} = createArticleServer(ARTICLE_FIXED_DESTINATIONS);
