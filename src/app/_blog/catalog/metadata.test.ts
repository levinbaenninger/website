import { describe, expect, test } from "vite-plus/test";

import { createRootMetadata } from "@/app/_site/metadata";

import { createBlogMetadata } from "./metadata";

describe("catalog metadata adapters", () => {
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
});
