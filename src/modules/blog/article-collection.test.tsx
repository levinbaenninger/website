import { Temporal } from "@js-temporal/polyfill";
import type { MDXContent } from "mdx/types";
import { describe, expect, expectTypeOf, test } from "vite-plus/test";

import { createArticleOperations } from "./article-collection";
import type { ArticleManifestEntry } from "./article-collection";
import type { ArticleCompilationFacts } from "./article-facts";
import type { ArticleCover, ArticleDetail, ArticleSummary } from "./types";

const TODAY = Temporal.PlainDate.from("2026-07-28");
const COVER: ArticleCover = {
  src: "/_next/static/media/cover.png",
  height: 1,
  width: 1,
};

const Content: MDXContent = () => <p>Article content</p>;
const EMPTY_ARTICLE_FACTS: ArticleCompilationFacts = {
  headings: [],
  links: [],
  searchText: "",
};

const entry = (
  slug: string,
  frontmatter: Readonly<Record<string, unknown>>,
  articleFacts: ArticleCompilationFacts = EMPTY_ARTICLE_FACTS
): ArticleManifestEntry => ({
  slug,
  cover: COVER,
  loadArticle: async () => {
    await Promise.resolve();
    return {
      __articleFacts: articleFacts,
      default: Content,
      frontmatter,
    };
  },
});

const draft = (slug: string) =>
  entry(slug, {
    title: `Draft ${slug}`,
    description: `Description for ${slug}.`,
    status: "Draft",
    tags: ["nextjs"],
  });

const published = (slug: string, publishedAt: string) =>
  entry(slug, {
    title: `Published ${slug}`,
    description: `Description for ${slug}.`,
    status: "Published",
    publishedAt,
    tags: ["web-performance", "nextjs"],
  });

describe("Article operations", () => {
  test("lists local Drafts first, then Published Articles deterministically", async () => {
    const articles = createArticleOperations({
      includeDrafts: true,
      manifest: [
        published("older", "2026-07-20"),
        draft("zebra"),
        published("same-day-z", "2026-07-25"),
        draft("alpha"),
        published("same-day-a", "2026-07-25"),
      ],
      today: TODAY,
    });

    const listedArticles = await articles.listArticles();

    expect(listedArticles.map(({ slug }) => slug)).toEqual([
      "alpha",
      "zebra",
      "same-day-a",
      "same-day-z",
      "older",
    ]);
  });

  test("production operations validate Drafts before excluding them", async () => {
    const articles = createArticleOperations({
      includeDrafts: false,
      manifest: [
        published("visible", "2026-07-20"),
        entry("invalid-draft", {
          title: "Invalid Draft",
          description: "This Draft still has to validate.",
          status: "Draft",
          tags: ["unknown"],
        }),
      ],
      today: TODAY,
    });

    await expect(articles.listArticles()).rejects.toThrow(/Tag/u);
  });

  test("production operations expose only Published Articles", async () => {
    const articles = createArticleOperations({
      includeDrafts: false,
      manifest: [draft("hidden"), published("visible", "2026-07-20")],
      today: TODAY,
    });

    expect(await articles.findArticleBySlug("hidden")).toBeNull();
    const listedArticles = await articles.listArticles();

    expect(listedArticles.map(({ slug }) => slug)).toEqual(["visible"]);
  });

  test("rejects collisions in the shared current and former slug namespace", async () => {
    const articles = createArticleOperations({
      includeDrafts: true,
      manifest: [
        draft("current"),
        entry("other", {
          title: "Other Draft",
          description: "This former slug collides with a current Article.",
          status: "Draft",
          tags: ["nextjs"],
          redirectFrom: ["current"],
        }),
      ],
      today: TODAY,
    });

    await expect(articles.listArticles()).rejects.toThrow(/collision/u);
  });

  test("retries collection construction after a rejected load is corrected", async () => {
    let corrected = false;
    const recoverableEntry: ArticleManifestEntry = {
      ...draft("recoverable"),
      loadArticle: async () => {
        await Promise.resolve();
        return {
          __articleFacts: {
            headings: [],
            links: [],
            searchText: "",
          },
          default: Content,
          frontmatter: {
            title: "Recoverable Draft",
            description: "This source is corrected between collection loads.",
            status: "Draft",
            tags: [corrected ? "nextjs" : "unknown"],
          },
        };
      },
    };
    const articles = createArticleOperations({
      includeDrafts: true,
      manifest: [recoverableEntry],
      today: TODAY,
    });

    await expect(articles.listArticles()).rejects.toThrow(/Tag/u);
    corrected = true;

    await expect(articles.listArticles()).resolves.toHaveLength(1);
  });

  test("looks up the current slug without exposing compiled module metadata", async () => {
    const articles = createArticleOperations({
      includeDrafts: true,
      manifest: [
        entry("current-slug", {
          title: "Current Slug",
          description: "A Draft with Tags in authored order.",
          status: "Draft",
          tags: ["web-performance", "nextjs"],
        }),
      ],
      today: TODAY,
    });

    const article = await articles.findArticleBySlug("current-slug");

    expect(article).toMatchObject({
      slug: "current-slug",
      href: "/blog/current-slug",
      Content,
      tags: [
        { id: "nextjs", label: "Next.js" },
        { id: "web-performance", label: "Web performance" },
      ],
    });
    expect(article).not.toHaveProperty("frontmatter");
    expect(article).not.toHaveProperty("redirectFrom");
  });

  test("returns readonly public projection types", async () => {
    const articles = createArticleOperations({
      includeDrafts: true,
      manifest: [draft("typed")],
      today: TODAY,
    });

    expectTypeOf(articles.listArticles).returns.resolves.toEqualTypeOf<
      readonly ArticleSummary[]
    >();
    expectTypeOf(
      articles.findArticleBySlug
    ).returns.resolves.toEqualTypeOf<ArticleDetail | null>();

    const [article] = await articles.listArticles();

    if (article === undefined) {
      throw new Error("Expected the typed Article fixture.");
    }

    expectTypeOf(article.tags).toEqualTypeOf<
      readonly { readonly id: string; readonly label: string }[]
    >();

    // @ts-expect-error Public projections are readonly.
    article.title = "Changed";
  });

  test("resolves Article fragments, publication rules, and fixed app destinations", async () => {
    const operations = createArticleOperations({
      fixedDestinations: [
        { fragments: ["work"], pathname: "/about" },
        { fragments: [], pathname: "/" },
      ],
      includeDrafts: true,
      manifest: [
        entry(
          "source",
          {
            title: "Source",
            description: "Published source.",
            status: "Published",
            publishedAt: "2026-07-20",
            tags: ["nextjs"],
          },
          {
            headings: [],
            links: [
              { href: "/blog/target#details" },
              { href: "/about#work" },
              { href: "/" },
            ],
            searchText: "Source",
          }
        ),
        entry(
          "target",
          {
            title: "Target",
            description: "Published target.",
            status: "Published",
            publishedAt: "2026-07-19",
            tags: ["nextjs"],
          },
          {
            headings: [{ depth: 2, id: "details", text: "Details" }],
            links: [],
            searchText: "Details",
          }
        ),
      ],
      today: TODAY,
    });

    await expect(operations.listArticles()).resolves.toHaveLength(2);

    const invalidFragment = createArticleOperations({
      includeDrafts: true,
      manifest: [
        entry(
          "source",
          {
            title: "Source",
            description: "Source with a broken fragment.",
            status: "Draft",
            tags: ["nextjs"],
          },
          {
            headings: [],
            links: [{ href: "/blog/target#missing" }],
            searchText: "",
          }
        ),
        draft("target"),
      ],
      today: TODAY,
    });

    await expect(invalidFragment.listArticles()).rejects.toThrow(
      /Article link fragment.*missing/u
    );

    const publishedToDraft = createArticleOperations({
      includeDrafts: true,
      manifest: [
        entry(
          "source",
          {
            title: "Source",
            description: "Published source.",
            status: "Published",
            publishedAt: "2026-07-20",
            tags: ["nextjs"],
          },
          {
            headings: [],
            links: [{ href: "/blog/draft-target" }],
            searchText: "",
          }
        ),
        draft("draft-target"),
      ],
      today: TODAY,
    });

    await expect(publishedToDraft.listArticles()).rejects.toThrow(
      /Published Article.*Draft/u
    );
  });
});
