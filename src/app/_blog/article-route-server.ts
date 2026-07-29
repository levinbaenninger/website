import {
  findArticle,
  findArticleRedirect,
  listArticleRedirects,
  listArticles,
} from "@/app/_blog/server";

import { createArticleRouteContract } from "./article-route";

export const articleRouteContract = createArticleRouteContract({
  findArticle,
  findArticleRedirect,
  listArticleRedirects,
  listArticles,
});
