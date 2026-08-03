// The catalog is the one place a Draft is meant to be visible, and only
// locally. This walks the real projection into the real view so a production
// build cannot start advertising unfinished writing.

import { Temporal } from "@js-temporal/polyfill";
import type { MDXContent } from "mdx/types";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";

import { createArticleOperations } from "@/modules/blog/articles/collection";
import type { ArticleManifestEntry } from "@/modules/blog/articles/collection";
import { BlogView } from "@/modules/blog/catalog/view";

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
});
