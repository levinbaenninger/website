import { SITE_IDENTITY } from "@/app/_config/site-identity";

export const twitterIdentity = {
  card: "summary_large_image",
  creator: SITE_IDENTITY.twitterHandle,
  site: SITE_IDENTITY.twitterHandle,
} as const;
