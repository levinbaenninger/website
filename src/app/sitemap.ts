import type { MetadataRoute } from "next";

import { createSitemap } from "@/app/_blog/discovery";
import { listPublishedArticleDiscoveryEntries } from "@/app/_blog/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return createSitemap(await listPublishedArticleDiscoveryEntries());
}
