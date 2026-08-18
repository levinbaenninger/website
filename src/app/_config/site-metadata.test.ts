import { expect, test } from "vite-plus/test";

import { createRootMetadata } from "@/app/_config/site-metadata";

test("maps the exact root identity", () => {
  expect(createRootMetadata()).toStrictEqual({
    alternates: {
      canonical: "https://levin.baenninger.me/",
      types: {
        "application/rss+xml": "https://levin.baenninger.me/blog/rss.xml",
      },
    },
    description:
      "Wrangling components by day, tinkering with side projects by night.",
    authors: [
      {
        name: "Levin Bänninger",
        url: "https://levin.baenninger.me/",
      },
    ],
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
      description:
        "Wrangling components by day, tinkering with side projects by night.",
      site: "@levinbaenninger",
      title: "Levin Bänninger",
    },
  });
});
