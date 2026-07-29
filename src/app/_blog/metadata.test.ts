import { describe, expect, test } from "vite-plus/test";

import { createRootMetadata } from "@/app/_metadata";
import type { ArticleDetail } from "@/modules/blog/articles";

import {
  createArticleMetadata,
  createBlogMetadata,
  createPublishedArticleStructuredDataInput,
} from "./metadata";

const Content = () => null;
const cover = {
  height: 630,
  src: "/article-cover.png",
  width: 1200,
};

const publishedArticle = {
  Content,
  cover,
  description: "A precise description.",
  discovery: {
    cover,
    description: "A precise description.",
    href: "/blog/canonical-article",
    publishedAt: "2026-01-15",
    tags: [
      { id: "nextjs", label: "Next.js" },
      { id: "web-performance", label: "Web performance" },
    ],
    title: "Canonical Article",
    updatedAt: "2026-07-15",
  },
  href: "/blog/canonical-article",
  publishedAt: "2026-01-15",
  slug: "canonical-article",
  status: "published",
  tags: [
    { id: "nextjs", label: "Next.js" },
    { id: "web-performance", label: "Web performance" },
  ],
  title: "Canonical Article",
  updatedAt: "2026-07-15",
} as const satisfies ArticleDetail;

describe("app metadata adapters", () => {
  test("maps exact root and Blog identity", () => {
    const root = createRootMetadata();
    const blog = createBlogMetadata();

    expect(root).toMatchObject({
      alternates: {
        canonical: "https://levin.baenninger.me/",
        types: {
          "application/rss+xml": "https://levin.baenninger.me/blog/rss.xml",
        },
      },
      description:
        "Wrangling components by day, tinkering with side projects by night.",
      metadataBase: new URL("https://levin.baenninger.me"),
      openGraph: {
        description:
          "Wrangling components by day, tinkering with side projects by night.",
        siteName: "Levin Bänninger",
        title: "Levin Bänninger",
        type: "website",
        url: "https://levin.baenninger.me/",
      },
      title: {
        default: "Levin Bänninger",
        template: "%s | Levin Bänninger",
      },
      twitter: {
        card: "summary_large_image",
        creator: "@levinbaenninger",
        site: "@levinbaenninger",
      },
    });
    expect(blog).toMatchObject({
      alternates: {
        canonical: "https://levin.baenninger.me/blog",
        types: {
          "application/rss+xml": "https://levin.baenninger.me/blog/rss.xml",
        },
      },
      description:
        "Writing about nerdy stuff—mostly software, the web, and whatever else catches my attention.",
      openGraph: {
        siteName: "Levin Bänninger",
        title: "Blog | Levin Bänninger",
        type: "website",
        url: "https://levin.baenninger.me/blog",
      },
      title: { absolute: "Blog | Levin Bänninger" },
      twitter: {
        card: "summary_large_image",
        creator: "@levinbaenninger",
        site: "@levinbaenninger",
        title: "Blog | Levin Bänninger",
      },
    });
  });

  test("maps Published Article facts, author, Tags, and Zurich dates", () => {
    expect(createArticleMetadata(publishedArticle)).toEqual({
      alternates: {
        canonical: "https://levin.baenninger.me/blog/canonical-article",
        types: {
          "application/rss+xml": "https://levin.baenninger.me/blog/rss.xml",
        },
      },
      authors: [
        {
          name: "Levin Bänninger",
          url: "https://levin.baenninger.me/",
        },
      ],
      description: "A precise description.",
      openGraph: {
        authors: ["https://levin.baenninger.me/"],
        description: "A precise description.",
        images: [
          {
            alt: "Canonical Article — Levin Bänninger",
            height: 630,
            type: "image/png",
            url: "https://levin.baenninger.me/blog/canonical-article/open-graph.png",
            width: 1200,
          },
        ],
        modifiedTime: "2026-07-15T00:00:00+02:00",
        publishedTime: "2026-01-15T00:00:00+01:00",
        siteName: "Levin Bänninger",
        tags: ["Next.js", "Web performance"],
        title: "Canonical Article | Levin Bänninger",
        type: "article",
        url: "https://levin.baenninger.me/blog/canonical-article",
      },
      title: { absolute: "Canonical Article | Levin Bänninger" },
      twitter: {
        card: "summary_large_image",
        creator: "@levinbaenninger",
        description: "A precise description.",
        images: [
          {
            alt: "Canonical Article — Levin Bänninger",
            height: 630,
            url: "https://levin.baenninger.me/blog/canonical-article/twitter-card.png",
            width: 1200,
          },
        ],
        site: "@levinbaenninger",
        title: "Canonical Article | Levin Bänninger",
      },
    });
  });

  test("gives local Drafts realistic metadata and strict robot directives", () => {
    const draft = {
      ...publishedArticle,
      discovery: null,
      publishedAt: null,
      status: "draft",
      updatedAt: null,
    } as const satisfies ArticleDetail;

    const metadata = createArticleMetadata(draft);

    expect(metadata.openGraph).not.toHaveProperty("publishedTime");
    expect(metadata.openGraph).not.toHaveProperty("modifiedTime");
    expect(metadata).toMatchObject({
      alternates: {
        canonical: "https://levin.baenninger.me/blog/canonical-article",
        types: {
          "application/rss+xml": "https://levin.baenninger.me/blog/rss.xml",
        },
      },
      robots: {
        follow: false,
        index: false,
        noarchive: true,
        noimageindex: true,
      },
      twitter: {
        card: "summary_large_image",
        creator: "@levinbaenninger",
        site: "@levinbaenninger",
      },
    });
  });

  test("keeps Published structured-data inputs grounded and Cover-specific", () => {
    expect(createPublishedArticleStructuredDataInput(publishedArticle)).toEqual(
      {
        author: {
          id: "https://levin.baenninger.me/#person",
          name: "Levin Bänninger",
          url: "https://levin.baenninger.me/",
        },
        dateModified: "2026-07-15T00:00:00+02:00",
        datePublished: "2026-01-15T00:00:00+01:00",
        description: "A precise description.",
        headline: "Canonical Article",
        id: "https://levin.baenninger.me/blog/canonical-article#article",
        image: "https://levin.baenninger.me/article-cover.png",
        inLanguage: "en",
        keywords: ["Next.js", "Web performance"],
        mainEntityOfPage: "https://levin.baenninger.me/blog/canonical-article",
        url: "https://levin.baenninger.me/blog/canonical-article",
      }
    );
  });
});
