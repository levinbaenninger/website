import type { MetadataRoute } from "next";

import { toCanonicalUrl } from "@/app/_config/site-identity";
import { listPublishedArticleDiscoveryEntries } from "@/app/blog/_articles/server";
import { createBlogSitemapEntries } from "@/features/blog/discovery/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogEntries = createBlogSitemapEntries(
    await listPublishedArticleDiscoveryEntries()
  );

  return [
    { url: toCanonicalUrl("/") },
    ...blogEntries.map(({ href, lastModified }) => ({
      url: toCanonicalUrl(href),
      ...(lastModified === undefined ? {} : { lastModified }),
    })),
  ];
}
