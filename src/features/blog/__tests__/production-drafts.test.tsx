import type { MDXContent } from "mdx/types";
import { renderToStaticMarkup } from "react-dom/server";
import { Temporal } from "temporal-polyfill";
import { describe, expect, test } from "vite-plus/test";

import { createArticleOperations } from "@/features/blog/articles/collection";
import type { ArticleManifestEntry } from "@/features/blog/articles/collection";
import { BlogView } from "@/features/blog/catalog/view";
import { serializeRss } from "@/features/blog/discovery/rss";
import { createBlogSitemapEntries } from "@/features/blog/discovery/sitemap";
import { serializeArticleSearchArtifact } from "@/features/blog/search/contract";

const Content: MDXContent = () => <p>body</p>;

const manifestEntry = (
  slug: string,
  status: "Draft" | "Published"
): ArticleManifestEntry => ({
  cover: { height: 630, src: `/covers/${slug}.png`, width: 1200 },
  loadArticle: async () => {
    await Promise.resolve();
    return {
      __articleFacts: { headings: [], links: [], searchText: `${slug} body` },
      default: Content,
      frontmatter: {
        description: `${slug} description.`,
        publishedAt: status === "Published" ? "2026-07-01" : undefined,
        status,
        tags: ["nextjs"],
        title: `${slug} title`,
      },
    };
  },
  slug,
});

const renderCatalog = async (includeDrafts: boolean): Promise<string> => {
  const operations = createArticleOperations({
    includeDrafts,
    manifest: [
      manifestEntry("unfinished-thought", "Draft"),
      manifestEntry("finished-thought", "Published"),
    ],
    today: Temporal.PlainDate.from("2026-07-28"),
  });

  const [articles, tags] = await Promise.all([
    operations.listArticles(),
    operations.listArticleTags(),
  ]);

  return renderToStaticMarkup(<BlogView articles={articles} tags={tags} />);
};

const canonicalUrl = (pathname: `/${string}`): string =>
  new URL(pathname, "https://levin.baenninger.me").href;

describe("Draft Articles in the catalog", () => {
  test("are presented as unpublished locally", async () => {
    const markup = await renderCatalog(true);

    expect(markup).toContain("unfinished-thought title");
    expect(markup).toContain("Not published");
  });

  test("are absent from the production catalog", async () => {
    const markup = await renderCatalog(false);

    expect(markup).toContain("finished-thought title");
    expect(markup).not.toContain("unfinished-thought");
    expect(markup).not.toContain("Not published");
  });

  test("are absent from every production discovery output", async () => {
    const operations = createArticleOperations({
      includeDrafts: false,
      manifest: [
        manifestEntry("unfinished-thought", "Draft"),
        manifestEntry("finished-thought", "Published"),
      ],
      today: Temporal.PlainDate.from("2026-07-28"),
    });
    const [discoveryEntries, searchDocuments] = await Promise.all([
      operations.listPublishedArticleDiscoveryEntries(),
      operations.listArticleSearchDocuments(),
    ]);

    const outputs = {
      rss: serializeRss(discoveryEntries, {
        author: { email: "levin@example.com", name: "Levin" },
        canonicalUrl,
        description: "Blog description.",
        name: "Levin’s Blog",
      }),
      search: serializeArticleSearchArtifact(searchDocuments),
      sitemap: createBlogSitemapEntries(discoveryEntries),
    };

    expect(JSON.stringify(outputs)).toContain("finished-thought");
    expect(JSON.stringify(outputs)).not.toContain("unfinished-thought");
  });
});
