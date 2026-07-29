import {
  findArticle,
  findArticleRedirect,
  listArticleRedirects,
  listArticles,
} from "@/app/_blog/articles/server";

import { createArticleRouteContract } from "./route";

export const articleRouteContract = createArticleRouteContract({
  findArticle,
  findArticleRedirect,
  listArticleRedirects,
  listArticles,
});
