import { createArticleServer } from "@/modules/blog/server";

import { ARTICLE_FIXED_DESTINATIONS } from "./article-destinations";

export const { findArticleBySlug, listArticles } = createArticleServer(
  ARTICLE_FIXED_DESTINATIONS
);
