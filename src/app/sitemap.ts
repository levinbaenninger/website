import type { MetadataRoute } from "next";

import { listPublishedArticleDiscoveryEntries } from "@/app/_blog/articles/server";
import { createSitemap } from "@/app/_blog/discovery/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return createSitemap(await listPublishedArticleDiscoveryEntries());
}
