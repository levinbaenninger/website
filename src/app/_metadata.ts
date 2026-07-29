import type { Metadata } from "next";

import {
  AUTHOR_IDENTITY,
  PORTFOLIO_IDENTITY,
  SITE_IDENTITY,
  toCanonicalUrl,
} from "@/app/_identity";

export const createRootMetadata = (): Metadata => {
  const canonicalUrl = toCanonicalUrl("/");

  return {
    metadataBase: new URL(SITE_IDENTITY.origin),
    title: {
      default: SITE_IDENTITY.name,
      template: `%s | ${SITE_IDENTITY.name}`,
    },
    description: PORTFOLIO_IDENTITY.tagline,
    authors: [
      {
        name: AUTHOR_IDENTITY.name,
        url: canonicalUrl,
      },
    ],
    alternates: {
      canonical: canonicalUrl,
      types: {
        "application/rss+xml": toCanonicalUrl("/blog/rss.xml"),
      },
    },
    openGraph: {
      type: "website",
      title: SITE_IDENTITY.name,
      description: PORTFOLIO_IDENTITY.tagline,
      url: canonicalUrl,
      siteName: SITE_IDENTITY.name,
    },
    twitter: {
      card: "summary_large_image",
      creator: SITE_IDENTITY.twitterHandle,
      site: SITE_IDENTITY.twitterHandle,
      title: SITE_IDENTITY.name,
      description: PORTFOLIO_IDENTITY.tagline,
    },
  };
};
