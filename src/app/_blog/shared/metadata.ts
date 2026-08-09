import { SITE_IDENTITY, toCanonicalUrl } from "@/app/_site/identity";

export const rssAlternate = {
  "application/rss+xml": toCanonicalUrl("/blog/rss.xml"),
} as const;

export const twitterIdentity = {
  card: "summary_large_image",
  creator: SITE_IDENTITY.twitterHandle,
  site: SITE_IDENTITY.twitterHandle,
} as const;
