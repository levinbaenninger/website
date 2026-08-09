import { Temporal } from "@js-temporal/polyfill";

import {
  SOCIAL_IMAGE_CONTENT_TYPE,
  SOCIAL_IMAGE_SIZE,
} from "@/shared/social-image";

import type { ArticleDetail } from "./types";

export interface ArticleDeliveryIdentity {
  readonly authorName: string;
  readonly origin: string;
  readonly siteName: string;
  readonly twitterHandle: `@${string}`;
}

const toCanonicalUrl = (
  pathname: `/${string}`,
  { origin }: ArticleDeliveryIdentity
): string => {
  const canonicalPathname =
    pathname === "/" ? pathname : pathname.replace(/\/+$/u, "");
  return new URL(canonicalPathname, origin).href;
};

const toZurichMidnight = (date: string): string =>
  Temporal.PlainDate.from(date)
    .toZonedDateTime("Europe/Zurich")
    .toString({ timeZoneName: "never" });

export const createArticleMetadataValues = (
  article: ArticleDetail,
  identity: ArticleDeliveryIdentity
) => {
  const canonicalUrl = toCanonicalUrl(article.href, identity);
  const authorUrl = toCanonicalUrl("/", identity);
  const title = `${article.title} | ${identity.siteName}`;
  const socialImageAlt = `${article.title} — ${identity.siteName}`;
  const openGraphImageUrl = toCanonicalUrl(
    `${article.href}/open-graph.png`,
    identity
  );
  const twitterImageUrl = toCanonicalUrl(
    `${article.href}/twitter-card.png`,
    identity
  );
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
    authors: [{ name: identity.authorName, url: authorUrl }],
    alternates: {
      canonical: canonicalUrl,
      types: {
        "application/rss+xml": toCanonicalUrl("/blog/rss.xml", identity),
      },
    },
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
      type: "article" as const,
      title,
      description: article.description,
      url: canonicalUrl,
      siteName: identity.siteName,
      authors: [authorUrl],
      tags: article.tags.map(({ label }) => label),
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
      card: "summary_large_image" as const,
      creator: identity.twitterHandle,
      site: identity.twitterHandle,
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

export interface PublishedArticleStructuredData {
  readonly "@context": "https://schema.org";
  readonly "@id": string;
  readonly "@type": "BlogPosting";
  readonly url: string;
  readonly mainEntityOfPage: string;
  readonly headline: string;
  readonly description: string;
  readonly image: string;
  readonly datePublished: string;
  readonly dateModified?: string;
  readonly author: {
    readonly "@id": string;
    readonly "@type": "Person";
    readonly name: string;
    readonly url: string;
  };
  readonly keywords: readonly string[];
  readonly inLanguage: "en";
}

export const createPublishedArticleStructuredData = (
  article: ArticleDetail & { readonly status: "published" },
  identity: ArticleDeliveryIdentity
): PublishedArticleStructuredData => {
  const canonicalUrl = toCanonicalUrl(article.href, identity);
  const authorUrl = toCanonicalUrl("/", identity);

  return {
    "@context": "https://schema.org",
    "@id": `${canonicalUrl}#article`,
    "@type": "BlogPosting",
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    headline: article.title,
    description: article.description,
    image: new URL(article.cover.src, identity.origin).href,
    datePublished: toZurichMidnight(article.publishedAt),
    ...(article.updatedAt === null
      ? {}
      : { dateModified: toZurichMidnight(article.updatedAt) }),
    author: {
      "@id": `${authorUrl}#person`,
      "@type": "Person",
      name: identity.authorName,
      url: authorUrl,
    },
    keywords: article.tags.map(({ label }) => label),
    inLanguage: "en",
  };
};

export const createArticleStructuredData = (
  article: ArticleDetail,
  identity: ArticleDeliveryIdentity
): PublishedArticleStructuredData | null =>
  article.status === "draft"
    ? null
    : createPublishedArticleStructuredData(article, identity);
