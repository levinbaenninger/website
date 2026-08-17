import { describe, expect, test } from "vite-plus/test";

import { createBlogMetadata } from "@/app/blog/_catalog/metadata";

describe("Blog catalog metadata adapter", () => {
  test("maps the production site identity into exact Blog metadata", () => {
    const blog = createBlogMetadata();

    expect(blog).toEqual({
      alternates: {
        canonical: "https://levin.baenninger.me/blog",
        types: {
          "application/rss+xml": "https://levin.baenninger.me/blog/rss.xml",
        },
      },
      description:
        "Writing about nerdy stuff—mostly software, the web, and whatever else catches my attention.",
      openGraph: {
        description:
          "Writing about nerdy stuff—mostly software, the web, and whatever else catches my attention.",
        siteName: "Levin Bänninger",
        title: "Blog | Levin Bänninger",
        type: "website",
        url: "https://levin.baenninger.me/blog",
      },
      title: { absolute: "Blog | Levin Bänninger" },
      twitter: {
        card: "summary_large_image",
        creator: "@levinbaenninger",
        description:
          "Writing about nerdy stuff—mostly software, the web, and whatever else catches my attention.",
        site: "@levinbaenninger",
        title: "Blog | Levin Bänninger",
      },
    });
  });
});
