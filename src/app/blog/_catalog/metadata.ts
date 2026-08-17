import type { Metadata } from "next";

import { SITE_IDENTITY, toCanonicalUrl } from "@/app/_config/site-identity";
import { twitterIdentity } from "@/app/blog/_shared/metadata";
import { createBlogCatalogMetadata } from "@/features/blog/catalog/metadata";

export const createBlogMetadata = (): Metadata => {
  const catalog = createBlogCatalogMetadata(SITE_IDENTITY.name);
  const canonicalUrl = toCanonicalUrl(catalog.canonicalHref);

  return {
    title: { absolute: catalog.title },
    description: catalog.description,
    alternates: {
      canonical: canonicalUrl,
      types: {
        [catalog.rss.mediaType]: toCanonicalUrl(catalog.rss.href),
      },
    },
    openGraph: {
      type: "website",
      title: catalog.title,
      description: catalog.description,
      url: canonicalUrl,
      siteName: SITE_IDENTITY.name,
    },
    twitter: {
      ...twitterIdentity,
      title: catalog.title,
      description: catalog.description,
    },
  };
};
