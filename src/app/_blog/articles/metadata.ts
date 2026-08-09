import type { Metadata } from "next";

import {
  SOCIAL_IMAGE_CONTENT_TYPE,
  SOCIAL_IMAGE_SIZE,
  authorMetadata,
  rssAlternate,
  toArticleTitle,
  toZurichMidnight,
  twitterIdentity,
} from "@/app/_blog/shared/metadata";
import {
  AUTHOR_IDENTITY,
  SITE_IDENTITY,
  toCanonicalUrl,
} from "@/app/_config/site-identity";
import type { ArticleDetail } from "@/features/blog/articles/types";

export const createArticleMetadata = (article: ArticleDetail): Metadata => {
  const canonicalUrl = toCanonicalUrl(article.href);
  const title = toArticleTitle(article.title);
  const socialImageAlt = `${article.title} — ${SITE_IDENTITY.name}`;
  const openGraphImageUrl = toCanonicalUrl(`${article.href}/open-graph.png`);
  const twitterImageUrl = toCanonicalUrl(`${article.href}/twitter-card.png`);
  const tagLabels = article.tags.map(({ label }) => label);
  const publishedTime =
    article.publishedAt === null
      ? undefined
      : toZurichMidnight(article.publishedAt);
  const modifiedTime =
    article.updatedAt === null
      ? undefined
      : toZurichMidnight(article.updatedAt);

  return {
    title: { absolute: title },
    description: article.description,
    authors: [authorMetadata],
    alternates: { canonical: canonicalUrl, types: rssAlternate },
    ...(article.status === "draft"
      ? {
          robots: {
            follow: false,
            index: false,
            noarchive: true,
            noimageindex: true,
          },
        }
      : {}),
    openGraph: {
      type: "article",
      title,
      description: article.description,
      url: canonicalUrl,
      siteName: SITE_IDENTITY.name,
      authors: [toCanonicalUrl("/")],
      tags: tagLabels,
      images: [
        {
          alt: socialImageAlt,
          height: SOCIAL_IMAGE_SIZE.height,
          type: SOCIAL_IMAGE_CONTENT_TYPE,
          url: openGraphImageUrl,
          width: SOCIAL_IMAGE_SIZE.width,
        },
      ],
      ...(publishedTime === undefined ? {} : { publishedTime }),
      ...(modifiedTime === undefined ? {} : { modifiedTime }),
    },
    twitter: {
      ...twitterIdentity,
      title,
      description: article.description,
      images: [
        {
          alt: socialImageAlt,
          height: SOCIAL_IMAGE_SIZE.height,
          url: twitterImageUrl,
          width: SOCIAL_IMAGE_SIZE.width,
        },
      ],
    },
  };
};

export interface PublishedArticleStructuredDataInput {
  readonly id: string;
  readonly url: string;
  readonly mainEntityOfPage: string;
  readonly headline: string;
  readonly description: string;
  readonly image: string;
  readonly datePublished: string;
  readonly dateModified?: string;
  readonly author: {
    readonly id: string;
    readonly name: string;
    readonly url: string;
  };
  readonly keywords: readonly string[];
  readonly inLanguage: "en";
}

export const createPublishedArticleStructuredDataInput = (
  article: ArticleDetail & { readonly status: "published" }
): PublishedArticleStructuredDataInput => {
  const canonicalUrl = toCanonicalUrl(article.href);

  return {
    id: `${canonicalUrl}#article`,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    headline: article.title,
    description: article.description,
    image: new URL(article.cover.src, SITE_IDENTITY.origin).href,
    datePublished: toZurichMidnight(article.publishedAt),
    ...(article.updatedAt === null
      ? {}
      : { dateModified: toZurichMidnight(article.updatedAt) }),
    author: {
      id: `${toCanonicalUrl("/")}#person`,
      name: AUTHOR_IDENTITY.name,
      url: toCanonicalUrl("/"),
    },
    keywords: article.tags.map(({ label }) => label),
    inLanguage: "en",
  };
};
