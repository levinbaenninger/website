import { Temporal } from "@js-temporal/polyfill";
import type { MDXContent } from "mdx/types";
import { describe, expect, test } from "vite-plus/test";

import { createArticleOperations } from "@/features/blog/articles/collection";
import type { ArticleManifestEntry } from "@/features/blog/articles/collection";
import { createArticleDeliveryOperations } from "@/features/blog/articles/delivery";
import { createArticleSocialImageDelivery } from "@/features/blog/articles/social-image";

const SENTINEL = "draft-canary-sentinel";
const FORMER_SLUG = `${SENTINEL}-former`;
const ASSET = `/_next/static/media/${SENTINEL}.png`;
const Content: MDXContent = () => <p>{SENTINEL}</p>;

const draftCanary: ArticleManifestEntry = {
  cover: { height: 1, src: ASSET, width: 1 },
  loadArticle: async () => {
    await Promise.resolve();
    return {
      __articleFacts: {
        headings: [{ depth: 2, id: SENTINEL, text: `${SENTINEL} heading` }],
        links: [],
        searchText: `${SENTINEL} searchable body`,
      },
      default: Content,
      frontmatter: {
        description: `${SENTINEL} description.`,
        redirectFrom: [FORMER_SLUG],
        status: "Draft",
        tags: ["web-performance"],
        title: `${SENTINEL} title`,
      },
    };
  },
  slug: SENTINEL,
};

describe("production Draft Article delivery", () => {
  test("keeps Draft outputs private across Blog projections", async () => {
    const articles = createArticleOperations({
      includeDrafts: false,
      manifest: [draftCanary],
      today: Temporal.PlainDate.from("2026-07-28"),
    });
    const route = createArticleDeliveryOperations(articles);
    const socialImages = createArticleSocialImageDelivery({
      findArticleSocialImage: articles.findArticleSocialImage,
      listArticleSocialImages: articles.listArticleSocialImages,
    });

    const outputs = {
      currentRoute: await route.resolve(SENTINEL),
      discoveryEntries: await articles.listPublishedArticleDiscoveryEntries(),
      formerRoute: await route.resolve(FORMER_SLUG),
      routeParams: await route.generateStaticParams(),
      searchDocuments: await articles.listArticleSearchDocuments(),
      socialImageParams: await socialImages.generateStaticParams(),
    };

    expect(outputs.currentRoute).toStrictEqual({ kind: "not-found" });
    expect(outputs.formerRoute).toStrictEqual({ kind: "not-found" });
    expect(outputs.routeParams).toStrictEqual([]);
    expect(outputs.socialImageParams).toStrictEqual([]);
    expect(JSON.stringify(outputs)).not.toContain(SENTINEL);
    expect(JSON.stringify(outputs)).not.toContain(FORMER_SLUG);
    expect(JSON.stringify(outputs)).not.toContain(ASSET);
    await expect(socialImages.findInput(SENTINEL)).resolves.toBeNull();
  });
});
