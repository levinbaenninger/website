import { Temporal } from "temporal-polyfill";

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

const DRAFT_ROBOTS = {
  follow: false,
  index: false,
  noarchive: true,
  noimageindex: true,
};

interface SocialImage {
  alt: string;
  height: number;
  type?: string;
  url: string;
  width: number;
}

interface ArticleOpenGraphDraft {
  type: "article";
  title: string;
  description: string;
  url: string;
  siteName: string;
  authors: string[];
  tags: string[];
  images: SocialImage[];
  publishedTime?: string;
  modifiedTime?: string;
}

interface ArticleMetadataDraft {
  title: { absolute: string };
  description: string;
  authors: { name: string; url: string }[];
  alternates: { canonical: string; types: { "application/rss+xml": string } };
  robots?: typeof DRAFT_ROBOTS;
  openGraph: ArticleOpenGraphDraft;
  twitter: {
    card: "summary_large_image";
    creator: string;
    site: string;
    title: string;
    description: string;
    images: SocialImage[];
  };
}

export const createArticleMetadataValues = (
  article: ArticleDetail,
  identity: ArticleDeliveryIdentity
): ArticleMetadataDraft => {
  const canonicalUrl = toCanonicalUrl(article.href, identity);
  const authorUrl = toCanonicalUrl("/", identity);
  const title = `${article.title} | ${identity.siteName}`;
  const socialImageAlt = `${article.title}: ${identity.siteName}`;
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

  const openGraph: ArticleOpenGraphDraft = {
    type: "article",
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
  };
  if (publishedTime !== undefined) {
    openGraph.publishedTime = publishedTime;
  }
  if (modifiedTime !== undefined) {
    openGraph.modifiedTime = modifiedTime;
  }

  const metadata: ArticleMetadataDraft = {
    title: { absolute: title },
    description: article.description,
    authors: [{ name: identity.authorName, url: authorUrl }],
    alternates: {
      canonical: canonicalUrl,
      types: {
        "application/rss+xml": toCanonicalUrl("/blog/rss.xml", identity),
      },
    },
    openGraph,
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
  if (article.status === "draft") {
    metadata.robots = DRAFT_ROBOTS;
  }
  return metadata;
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
    dateModified:
      article.updatedAt === null
        ? undefined
        : toZurichMidnight(article.updatedAt),
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
