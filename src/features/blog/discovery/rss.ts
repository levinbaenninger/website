import { Temporal } from "@js-temporal/polyfill";

import type { ArticleDiscoveryEntry } from "@/features/blog/articles/types";
import { isXml10CompatibleText } from "@/shared/xml/xml-characters";

import { getLatestArticleDate } from "./sitemap";

const RSS_MEDIA_TYPE = "application/rss+xml";

export interface BlogRssIdentity {
  readonly author: {
    readonly email: string;
    readonly name: string;
  };
  readonly canonicalUrl: (pathname: `/${string}`) => string;
  readonly description: string;
  readonly name: string;
}

const escapeXml = (value: string): string => {
  if (!isXml10CompatibleText(value)) {
    throw new Error(
      "RSS text must contain only XML 1.0-compatible characters."
    );
  }

  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
};

const toRfc822 = (date: string): string => {
  const instant = Temporal.PlainDate.from(date)
    .toZonedDateTime("Europe/Zurich")
    .toInstant();
  return new Date(instant.epochMilliseconds).toUTCString();
};

const serializeItem = (
  article: ArticleDiscoveryEntry,
  identity: BlogRssIdentity
): string => {
  const canonicalUrl = identity.canonicalUrl(article.href);
  const categories = article.tags
    .map(({ label }) => `      <category>${escapeXml(label)}</category>`)
    .join("\n");

  return [
    "    <item>",
    `      <title>${escapeXml(article.title)}</title>`,
    `      <link>${escapeXml(canonicalUrl)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(canonicalUrl)}</guid>`,
    `      <description>${escapeXml(article.description)}</description>`,
    `      <author>${escapeXml(`${identity.author.email} (${identity.author.name})`)}</author>`,
    `      <dc:creator>${escapeXml(identity.author.name)}</dc:creator>`,
    categories,
    `      <pubDate>${toRfc822(article.publishedAt)}</pubDate>`,
    "    </item>",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
};

export const serializeRss = (
  articles: readonly ArticleDiscoveryEntry[],
  identity: BlogRssIdentity
): string => {
  const blogUrl = identity.canonicalUrl("/blog");
  const feedUrl = identity.canonicalUrl("/blog/rss.xml");
  const latestArticleDate = getLatestArticleDate(articles);
  const items = articles.map((article) => serializeItem(article, identity));

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    `    <title>${escapeXml(identity.name)}</title>`,
    `    <link>${escapeXml(blogUrl)}</link>`,
    `    <description>${escapeXml(identity.description)}</description>`,
    "    <language>en</language>",
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="${RSS_MEDIA_TYPE}"/>`,
    ...(latestArticleDate === undefined
      ? []
      : [`    <lastBuildDate>${toRfc822(latestArticleDate)}</lastBuildDate>`]),
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
};
