import { Temporal } from "@js-temporal/polyfill";

import {
  AUTHOR_IDENTITY,
  SITE_IDENTITY,
  toCanonicalUrl,
} from "@/app/_site/identity";

export {
  SOCIAL_IMAGE_CONTENT_TYPE,
  SOCIAL_IMAGE_SIZE,
} from "@/shared/social-image";

export const authorMetadata = {
  name: AUTHOR_IDENTITY.name,
  url: toCanonicalUrl("/"),
} as const;

export const rssAlternate = {
  "application/rss+xml": toCanonicalUrl("/blog/rss.xml"),
} as const;

export const twitterIdentity = {
  card: "summary_large_image",
  creator: SITE_IDENTITY.twitterHandle,
  site: SITE_IDENTITY.twitterHandle,
} as const;

export const toArticleTitle = (title: string): string =>
  `${title} | ${SITE_IDENTITY.name}`;

export const toZurichMidnight = (date: string): string =>
  Temporal.PlainDate.from(date)
    .toZonedDateTime("Europe/Zurich")
    .toString({ timeZoneName: "never" });
