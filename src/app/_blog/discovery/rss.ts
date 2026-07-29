import { Temporal } from "@js-temporal/polyfill";

import {
  AUTHOR_IDENTITY,
  BLOG_IDENTITY,
  toCanonicalUrl,
} from "@/app/_site/identity";
import type { ArticleDiscoveryEntry } from "@/modules/blog/articles";
import { isXml10CompatibleText } from "@/shared/xml/xml-characters";

import { getLatestArticleDate } from "./sitemap";

const RSS_MEDIA_TYPE = "application/rss+xml";
const RSS_CONTENT_TYPE = `${RSS_MEDIA_TYPE}; charset=utf-8`;

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

const serializeItem = (article: ArticleDiscoveryEntry): string => {
  const canonicalUrl = toCanonicalUrl(article.href);
  const categories = article.tags
    .map(({ label }) => `      <category>${escapeXml(label)}</category>`)
    .join("\n");

  return [
    "    <item>",
    `      <title>${escapeXml(article.title)}</title>`,
    `      <link>${escapeXml(canonicalUrl)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(canonicalUrl)}</guid>`,
    `      <description>${escapeXml(article.description)}</description>`,
    `      <author>${escapeXml(`${AUTHOR_IDENTITY.email} (${AUTHOR_IDENTITY.name})`)}</author>`,
    `      <dc:creator>${escapeXml(AUTHOR_IDENTITY.name)}</dc:creator>`,
    categories,
    `      <pubDate>${toRfc822(article.publishedAt)}</pubDate>`,
    "    </item>",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
};

export const serializeRss = (
  articles: readonly ArticleDiscoveryEntry[]
): string => {
  const blogUrl = toCanonicalUrl("/blog");
  const feedUrl = toCanonicalUrl("/blog/rss.xml");
  const latestArticleDate = getLatestArticleDate(articles);
  const items = articles.map(serializeItem);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    `    <title>${escapeXml(BLOG_IDENTITY.name)}</title>`,
    `    <link>${escapeXml(blogUrl)}</link>`,
    `    <description>${escapeXml(BLOG_IDENTITY.description)}</description>`,
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

export const createRssResponse = (
  articles: readonly ArticleDiscoveryEntry[]
): Response =>
  new Response(serializeRss(articles), {
    headers: {
      "Content-Type": RSS_CONTENT_TYPE,
      "X-Robots-Tag": "noindex, follow",
    },
  });
