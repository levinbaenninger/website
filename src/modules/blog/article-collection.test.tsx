import { Temporal } from "@js-temporal/polyfill";
import type { MDXContent } from "mdx/types";
import { describe, expect, expectTypeOf, test } from "vite-plus/test";

import { createArticleOperations } from "./article-collection";
import type {
  ArticleManifestEntry,
  ArticleOperations,
} from "./article-collection";
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
const DRAFT_CANARY_SENTINEL = "web-performance";
const DRAFT_CANARY_FORMER_SLUG = `${DRAFT_CANARY_SENTINEL}-former`;
const DRAFT_CANARY_ASSET = `/_next/static/media/${DRAFT_CANARY_SENTINEL}-asset.png`;

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

const draftCanary = (onLoad?: () => void): ArticleManifestEntry => {
  const canary = entry(
    DRAFT_CANARY_SENTINEL,
    {
      title: `${DRAFT_CANARY_SENTINEL} title`,
      description: `${DRAFT_CANARY_SENTINEL} description.`,
      status: "Draft",
      tags: [DRAFT_CANARY_SENTINEL],
      redirectFrom: [DRAFT_CANARY_FORMER_SLUG],
    },
    {
      headings: [
        {
          depth: 2,
          id: DRAFT_CANARY_SENTINEL,
          text: `${DRAFT_CANARY_SENTINEL} heading`,
        },
      ],
      links: [],
      searchText: `${DRAFT_CANARY_SENTINEL} searchable body`,
    }
  );

  return {
    ...canary,
    cover: { ...COVER, src: DRAFT_CANARY_ASSET },
    loadArticle: async () => {
      onLoad?.();
      return await canary.loadArticle();
    },
  };
};

const published = (slug: string, publishedAt: string) =>
  entry(slug, {
    title: `Published ${slug}`,
    description: `Description for ${slug}.`,
    status: "Published",
    publishedAt,
    tags: ["web-performance", "nextjs"],
  });

const callEveryArticleOperation = (
  operations: ArticleOperations,
  {
    currentSlug,
    formerSlug,
  }: { readonly currentSlug: string; readonly formerSlug: string }
) =>
  [
    operations.listArticles(),
    operations.findArticle(currentSlug),
    operations.listArticleTags(),
    operations.findArticleRedirect(formerSlug),
    operations.listArticleRedirects(),
    operations.listPublishedArticleDiscoveryEntries(),
    operations.listArticleSearchDocuments(),
    operations.listArticleSocialImages(),
    operations.findArticleSocialImage(currentSlug),
  ] as const;

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

    expect(await articles.findArticle("hidden")).toBeNull();
    const listedArticles = await articles.listArticles();

    expect(listedArticles.map(({ slug }) => slug)).toEqual(["visible"]);
  });

  test("loads the Draft canary but excludes its sentinel from every production projection", async () => {
    let draftLoadCount = 0;
    const articles = createArticleOperations({
      includeDrafts: false,
      manifest: [
        draftCanary(() => {
          draftLoadCount += 1;
        }),
        entry("published", {
          title: "Published",
          description: "The only production-visible Article.",
          status: "Published",
          publishedAt: "2026-07-20",
          tags: ["nextjs"],
          redirectFrom: ["published-former"],
        }),
      ],
      today: TODAY,
    });

    const operationOutput = await Promise.all(
      callEveryArticleOperation(articles, {
        currentSlug: DRAFT_CANARY_SENTINEL,
        formerSlug: DRAFT_CANARY_FORMER_SLUG,
      })
    );
    const [, currentArticle, , formerSlugRedirect] = operationOutput;
    const serialized = JSON.stringify(operationOutput);

    expect(draftLoadCount).toBe(1);
    expect(serialized).not.toContain(DRAFT_CANARY_SENTINEL);
    expect(serialized).not.toContain(DRAFT_CANARY_FORMER_SLUG);
    expect(serialized).not.toContain(DRAFT_CANARY_ASSET);
    expect(currentArticle).toBeNull();
    expect(formerSlugRedirect).toBeNull();
  });

  test("exposes the same Draft canary only through intended local projections", async () => {
    let draftLoadCount = 0;
    const articles = createArticleOperations({
      includeDrafts: true,
      manifest: [
        draftCanary(() => {
          draftLoadCount += 1;
        }),
        entry("published", {
          title: "Published",
          description: "Published description.",
          status: "Published",
          publishedAt: "2026-07-20",
          tags: ["nextjs"],
        }),
      ],
      today: TODAY,
    });

    const [
      articleSummaries,
      articleDetail,
      tagFacets,
      formerSlugRedirect,
      redirects,
      discoveryEntries,
      searchDocuments,
      socialImages,
      socialImage,
    ] = await Promise.all(
      callEveryArticleOperation(articles, {
        currentSlug: DRAFT_CANARY_SENTINEL,
        formerSlug: DRAFT_CANARY_FORMER_SLUG,
      })
    );

    expect(draftLoadCount).toBe(1);
    expect(JSON.stringify(articleSummaries)).toContain(DRAFT_CANARY_SENTINEL);
    expect(JSON.stringify(articleDetail)).toContain(DRAFT_CANARY_ASSET);
    expect(tagFacets).toContainEqual({
      articleCount: 1,
      id: DRAFT_CANARY_SENTINEL,
      label: "Web performance",
    });
    expect(formerSlugRedirect).toBe(`/blog/${DRAFT_CANARY_SENTINEL}`);
    expect(JSON.stringify(redirects)).toContain(DRAFT_CANARY_FORMER_SLUG);
    expect(JSON.stringify(discoveryEntries)).not.toContain(
      DRAFT_CANARY_SENTINEL
    );
    expect(JSON.stringify(searchDocuments)).toContain(
      `${DRAFT_CANARY_SENTINEL} searchable body`
    );
    expect(JSON.stringify(socialImages)).toContain(DRAFT_CANARY_SENTINEL);
    expect(JSON.stringify(socialImage)).toContain(DRAFT_CANARY_SENTINEL);
  });

  test("gives Draft-only and empty collections identical empty production projections", async () => {
    const draftOnly = createArticleOperations({
      includeDrafts: false,
      manifest: [draftCanary()],
      today: TODAY,
    });
    const empty = createArticleOperations({
      includeDrafts: false,
      manifest: [],
      today: TODAY,
    });
    const operationArguments = {
      currentSlug: DRAFT_CANARY_SENTINEL,
      formerSlug: DRAFT_CANARY_FORMER_SLUG,
    };

    await expect(
      Promise.all(callEveryArticleOperation(draftOnly, operationArguments))
    ).resolves.toEqual(
      await Promise.all(callEveryArticleOperation(empty, operationArguments))
    );
  });

  test("exposes renderer-neutral social-image inputs for visible current Articles only", async () => {
    const articles = createArticleOperations({
      includeDrafts: false,
      manifest: [
        entry("draft-article", {
          title: "Hidden Draft",
          description: "This Draft must not own a production image.",
          status: "Draft",
          tags: ["nextjs"],
          redirectFrom: ["draft-article-former"],
        }),
        entry("published-article", {
          title: "Visible Article",
          description: "This Published Article owns a social image.",
          status: "Published",
          publishedAt: "2026-07-20",
          tags: ["nextjs"],
          redirectFrom: ["published-article-former"],
        }),
      ],
      today: TODAY,
    });

    await expect(articles.listArticleSocialImages()).resolves.toEqual([
      {
        alt: "Visible Article — Levin Bänninger",
        label: "Article",
        slug: "published-article",
        title: "Visible Article",
      },
    ]);
    await expect(
      articles.findArticleSocialImage("published-article")
    ).resolves.toEqual({
      alt: "Visible Article — Levin Bänninger",
      label: "Article",
      slug: "published-article",
      title: "Visible Article",
    });
    await expect(
      articles.findArticleSocialImage("draft-article")
    ).resolves.toBeNull();
    await expect(
      articles.findArticleSocialImage("published-article-former")
    ).resolves.toBeNull();

    expect(
      JSON.stringify(await articles.listArticleSocialImages())
    ).not.toContain("cover");
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

  test("rejects every operation when canonical collection construction fails", async () => {
    const articles = createArticleOperations({
      includeDrafts: false,
      manifest: [
        entry("invalid", {
          title: "Invalid",
          description: "An invalid production-hidden Draft.",
          status: "Draft",
          tags: ["unknown"],
        }),
      ],
      today: TODAY,
    });

    const results = await Promise.allSettled(
      callEveryArticleOperation(articles, {
        currentSlug: "invalid",
        formerSlug: "invalid-former",
      })
    );

    expect(results.every(({ status }) => status === "rejected")).toBe(true);
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

    const article = await articles.findArticle("current-slug");

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
      articles.findArticle
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

  test("exposes the narrow Article operation surface", () => {
    const articles = createArticleOperations({
      includeDrafts: true,
      manifest: [],
      today: TODAY,
    });

    expect(Object.keys(articles).toSorted()).toEqual([
      "findArticle",
      "findArticleRedirect",
      "findArticleSocialImage",
      "listArticleRedirects",
      "listArticleSearchDocuments",
      "listArticleSocialImages",
      "listArticleTags",
      "listArticles",
      "listPublishedArticleDiscoveryEntries",
    ]);
  });

  test("projects explicit public dates without leaking compiled facts", async () => {
    const articles = createArticleOperations({
      includeDrafts: true,
      manifest: [
        entry(
          "draft-article",
          {
            title: "Draft article",
            description: "A Draft without publication dates.",
            status: "Draft",
            tags: ["nextjs"],
          },
          {
            headings: [{ depth: 2, id: "private", text: "Private heading" }],
            links: [],
            searchText: "Private body",
          }
        ),
        entry("published-article", {
          title: "Published article",
          description: "A Published Article with an update.",
          status: "Published",
          publishedAt: "2026-07-20",
          updatedAt: "2026-07-21",
          tags: ["nextjs"],
        }),
      ],
      today: TODAY,
    });

    const summaries = await articles.listArticles();
    const detail = await articles.findArticle("draft-article");

    expect(summaries).toMatchObject([
      {
        slug: "draft-article",
        status: "draft",
        publishedAt: null,
        updatedAt: null,
      },
      {
        slug: "published-article",
        status: "published",
        publishedAt: "2026-07-20",
        updatedAt: "2026-07-21",
      },
    ]);
    expect(JSON.stringify(summaries)).not.toContain("Private");
    expect(detail).toMatchObject({
      Content,
      discovery: null,
      status: "draft",
    });
    expect(detail).not.toHaveProperty("articleFacts");
  });

  test("filters listings by one exact Tag and counts visible Tag facets", async () => {
    const articles = createArticleOperations({
      includeDrafts: true,
      manifest: [
        draft("draft-nextjs"),
        published("published-both", "2026-07-20"),
      ],
      today: TODAY,
    });

    const nextjsArticles = await articles.listArticles({ tag: "nextjs" });

    expect(nextjsArticles.map(({ slug }) => slug)).toEqual([
      "draft-nextjs",
      "published-both",
    ]);
    await expect(articles.listArticles({ tag: "unknown" })).resolves.toEqual(
      []
    );
    await expect(articles.listArticleTags()).resolves.toEqual([
      { articleCount: 2, id: "nextjs", label: "Next.js" },
      { articleCount: 1, id: "web-performance", label: "Web performance" },
    ]);
  });

  test("resolves and orders only visible direct former-slug redirects", async () => {
    const articles = createArticleOperations({
      includeDrafts: false,
      manifest: [
        entry("visible", {
          title: "Visible",
          description: "A Published Article with former slugs.",
          status: "Published",
          publishedAt: "2026-07-20",
          tags: ["nextjs"],
          redirectFrom: ["z-former", "a-former"],
        }),
        entry("hidden", {
          title: "Hidden",
          description: "A production-hidden Draft with a former slug.",
          status: "Draft",
          tags: ["nextjs"],
          redirectFrom: ["hidden-former"],
        }),
      ],
      today: TODAY,
    });

    await expect(articles.findArticleRedirect("a-former")).resolves.toBe(
      "/blog/visible"
    );
    await expect(
      Promise.all(
        ["visible", "hidden", "hidden-former", "not a slug"].map(
          async (slug) => await articles.findArticleRedirect(slug)
        )
      )
    ).resolves.toEqual([null, null, null, null]);
    await expect(articles.listArticleRedirects()).resolves.toEqual([
      { href: "/blog/visible", slug: "a-former" },
      { href: "/blog/visible", slug: "z-former" },
    ]);
  });

  test("keeps discovery Published-only and search documents environment-visible", async () => {
    const articles = createArticleOperations({
      includeDrafts: true,
      manifest: [
        entry(
          "z-draft",
          {
            title: "Draft",
            description: "A locally searchable Draft.",
            status: "Draft",
            tags: ["nextjs"],
          },
          {
            headings: [{ depth: 2, id: "draft", text: "Draft heading" }],
            links: [],
            searchText: "Draft body",
          }
        ),
        entry(
          "a-published",
          {
            title: "Published",
            description: "A discoverable Published Article.",
            status: "Published",
            publishedAt: "2026-07-20",
            tags: ["web-performance", "nextjs"],
          },
          {
            headings: [{ depth: 2, id: "intro", text: "Introduction" }],
            links: [],
            searchText: "Published body",
          }
        ),
      ],
      today: TODAY,
    });

    await expect(
      articles.listPublishedArticleDiscoveryEntries()
    ).resolves.toMatchObject([
      {
        href: "/blog/a-published",
        publishedAt: "2026-07-20",
        updatedAt: null,
      },
    ]);
    await expect(articles.listArticleSearchDocuments()).resolves.toEqual([
      {
        body: "Published body",
        description: "A discoverable Published Article.",
        headings: ["Introduction"],
        href: "/blog/a-published",
        id: "a-published",
        status: "published",
        tags: [
          { id: "nextjs", label: "Next.js" },
          { id: "web-performance", label: "Web performance" },
        ],
        title: "Published",
      },
      {
        body: "Draft body",
        description: "A locally searchable Draft.",
        headings: ["Draft heading"],
        href: "/blog/z-draft",
        id: "z-draft",
        status: "draft",
        tags: [{ id: "nextjs", label: "Next.js" }],
        title: "Draft",
      },
    ]);
  });

  test("memoizes in-flight collection construction across every operation", async () => {
    let loadCount = 0;
    const loaded = draft("loaded-once");
    const operations = createArticleOperations({
      includeDrafts: true,
      manifest: [
        {
          ...loaded,
          loadArticle: async () => {
            loadCount += 1;
            return await loaded.loadArticle();
          },
        },
      ],
      today: TODAY,
    });

    await Promise.all(
      callEveryArticleOperation(operations, {
        currentSlug: "loaded-once",
        formerSlug: "former",
      })
    );

    expect(loadCount).toBe(1);
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

  test("rejects missing same-Article fragments", async () => {
    const operations = createArticleOperations({
      includeDrafts: true,
      manifest: [
        entry(
          "source",
          {
            title: "Source",
            description: "A source with a missing local fragment.",
            status: "Draft",
            tags: ["nextjs"],
          },
          {
            headings: [],
            links: [{ href: "#missing" }],
            searchText: "",
          }
        ),
      ],
      today: TODAY,
    });

    await expect(operations.listArticles()).rejects.toThrow(
      /Article link fragment.*missing/u
    );
  });
});
