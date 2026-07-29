import type { Metadata } from "next";

import { rssAlternate, twitterIdentity } from "@/app/_blog/shared/metadata";
import {
  BLOG_IDENTITY,
  SITE_IDENTITY,
  toCanonicalUrl,
} from "@/app/_site/identity";

export const createBlogMetadata = (): Metadata => {
  const canonicalUrl = toCanonicalUrl("/blog");

  return {
    title: { absolute: BLOG_IDENTITY.title },
    description: BLOG_IDENTITY.description,
    alternates: { canonical: canonicalUrl, types: rssAlternate },
    openGraph: {
      type: "website",
      title: BLOG_IDENTITY.title,
      description: BLOG_IDENTITY.description,
      url: canonicalUrl,
      siteName: SITE_IDENTITY.name,
    },
    twitter: {
      ...twitterIdentity,
      title: BLOG_IDENTITY.title,
      description: BLOG_IDENTITY.description,
    },
  };
};
