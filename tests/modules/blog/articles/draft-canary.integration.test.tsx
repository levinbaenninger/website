import { Temporal } from "@js-temporal/polyfill";
import type { MDXContent } from "mdx/types";
import { describe, expect, test, vi } from "vite-plus/test";

import { createArticleRouteContract } from "@/app/_blog/articles/route";
import { createArticleSocialImageContract } from "@/app/_blog/articles/social-image";
import { createRssResponse } from "@/app/_blog/discovery/rss";
import { createSitemap } from "@/app/_blog/discovery/sitemap";
import { createArticleSearchResponse } from "@/app/_blog/search/route";
import { createArticleOperations } from "@/modules/blog/articles/collection";
import type { ArticleManifestEntry } from "@/modules/blog/articles/collection";

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

describe("production Draft canary", () => {
  test("stays absent from routing, discovery, search, and images", async () => {
    const articles = createArticleOperations({
      includeDrafts: false,
      manifest: [draftCanary],
      today: Temporal.PlainDate.from("2026-07-28"),
    });
    const route = createArticleRouteContract(articles);
    const discoveryEntries =
      await articles.listPublishedArticleDiscoveryEntries();
    const searchDocuments = await articles.listArticleSearchDocuments();
    const notFound = vi.fn((): never => {
      throw new Error("not found");
    });
    const socialImages = createArticleSocialImageContract({
      findArticleSocialImage: articles.findArticleSocialImage,
      listArticleSocialImages: articles.listArticleSocialImages,
      notFound,
      render: vi.fn(() => new Response("png")),
    });

    const outputs = {
      currentRoute: await route.resolve(SENTINEL),
      formerRoute: await route.resolve(FORMER_SLUG),
      routeParams: await route.generateStaticParams(),
      rss: await createRssResponse(discoveryEntries).text(),
      search: await createArticleSearchResponse(searchDocuments).text(),
      sitemap: createSitemap(discoveryEntries),
      socialImageParams: await socialImages.generateStaticParams(),
    };

    expect(outputs.currentRoute).toEqual({ kind: "not-found" });
    expect(outputs.formerRoute).toEqual({ kind: "not-found" });
    expect(outputs.routeParams).toEqual([]);
    expect(outputs.socialImageParams).toEqual([]);
    expect(JSON.stringify(outputs)).not.toContain(SENTINEL);
    expect(JSON.stringify(outputs)).not.toContain(FORMER_SLUG);
    expect(JSON.stringify(outputs)).not.toContain(ASSET);
    await expect(
      socialImages.render({ params: Promise.resolve({ slug: SENTINEL }) })
    ).rejects.toThrow("not found");
  });
});
