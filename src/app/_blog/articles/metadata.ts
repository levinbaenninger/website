import type { Metadata } from "next";

import { AUTHOR_IDENTITY, SITE_IDENTITY } from "@/app/_site/identity";
import { createArticleMetadataValues } from "@/features/blog/articles/delivery-metadata";
import type { ArticleDetail } from "@/features/blog/articles/types";

export const ARTICLE_DELIVERY_IDENTITY = {
  authorName: AUTHOR_IDENTITY.name,
  origin: SITE_IDENTITY.origin,
  siteName: SITE_IDENTITY.name,
  twitterHandle: SITE_IDENTITY.twitterHandle,
} as const;

export const createArticleMetadata = (article: ArticleDetail): Metadata =>
  createArticleMetadataValues(article, ARTICLE_DELIVERY_IDENTITY);
