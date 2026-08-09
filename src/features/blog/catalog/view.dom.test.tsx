import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { OnUrlUpdateFunction } from "nuqs/adapters/testing";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import { renderToStaticMarkup } from "react-dom/server";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vite-plus/test";

import type {
  ArticleSearchDocument,
  ArticleSummary,
  ArticleTagFacet,
} from "@/features/blog/articles/types";
import { createArticleSearchArtifact } from "@/features/blog/search/contract";
import { createArticleSearchLoader } from "@/features/blog/search/service";
import type { ArticleSearch } from "@/features/blog/search/service";

import {
  draftArticle,
  NEXTJS,
  publishedArticle,
  searchDocument,
  TAG_FACETS,
  WEB_PERFORMANCE,
} from "./test-fixtures";
import { BlogView } from "./view";

// The one true boundary in this island: the lazy import of Fuse and the fetch
// of the static artifact. Everything behind it — the real service, the real
// Fuse configuration, real highlight ranges — is exercised for real, because
// the point of most of these tests is what the visitor is shown about a match.
const { loadArticleSearch } = vi.hoisted(() => ({
  loadArticleSearch: vi.fn<() => Promise<ArticleSearch>>(),
}));

vi.mock(import("@/features/blog/search/loader"), async (importOriginal) => ({
  ...(await importOriginal()),
  loadArticleSearch,
}));

// The prerender: `renderToStaticMarkup` runs no effects, so the island never
// reaches its live branch. This is exactly the catalog a visitor receives
// before — or without — any JavaScript, and it needs no URL adapter.
const renderServer = (articles: readonly ArticleSummary[]) => {
  const markup = renderToStaticMarkup(
    <BlogView articles={articles} tags={TAG_FACETS} />
  );
  const container = document.createElement("div");

  container.innerHTML = markup;
  document.body.append(container);

  return { container, markup };
};

const renderHydrated = (
  articles: readonly ArticleSummary[],
  {
    hasMemory = true,
    onUrlUpdate,
    searchParams = "",
    tags = TAG_FACETS,
  }: {
    hasMemory?: boolean;
    onUrlUpdate?: OnUrlUpdateFunction;
    searchParams?: string;
    tags?: readonly ArticleTagFacet[];
  } = {}
) =>
  render(<BlogView articles={articles} tags={tags} />, {
    wrapper: withNuqsTestingAdapter({
      hasMemory,
      onUrlUpdate,
      searchParams,
    }),
  });

const threeArticles = [
  publishedArticle({ slug: "cache", title: "Understanding cache components" }),
  publishedArticle({ slug: "budgets", title: "Budgeting images" }),
  publishedArticle({ slug: "seams", title: "Seams worth testing" }),
];

// Two Tags on one Article: the reason the facet counts do not sum to `All`.
const taggedArticles = [
  publishedArticle({
    slug: "cache",
    tags: [NEXTJS, WEB_PERFORMANCE],
    title: "Understanding cache components",
  }),
  publishedArticle({
    slug: "budgets",
    tags: [NEXTJS],
    title: "Budgeting images",
  }),
  publishedArticle({ slug: "seams", title: "Seams worth testing" }),
];

// The same three Articles as `taggedArticles`, with the visible text the
// artifact carries: a Tag-only match, a heading-only match and a body-only
// match are each reachable by exactly one query.
const searchDocuments: readonly ArticleSearchDocument[] = [
  searchDocument({
    body: "Every image budget dies in a spreadsheet.",
    headings: ["Enforcing at build time"],
    slug: "budgets",
    tags: [NEXTJS],
    title: "Budgeting images",
  }),
  searchDocument({
    body: "The catalog is prerendered and the artifact is a static asset.",
    headings: ["Cache profiles"],
    slug: "cache",
    tags: [NEXTJS, WEB_PERFORMANCE],
    title: "Understanding cache components",
  }),
  searchDocument({
    body: "A seam is where a test replaces production behaviour.",
    headings: ["Injecting a fetch"],
    slug: "seams",
    title: "Seams worth testing",
  }),
];

const searchOver = async (
  documents: readonly ArticleSearchDocument[]
): Promise<ArticleSearch> =>
  await createArticleSearchLoader({
    fetchArtifact: async () =>
      await Promise.resolve(
        Response.json(createArticleSearchArtifact(documents))
      ),
    loadFuse: async () => await import("fuse.js"),
  }).load();

const hrefsOf = () =>
  screen.getAllByRole("link").map((link) => link.getAttribute("href"));

const radio = (name: string) => screen.getByRole("radio", { name });

const searchBox = () =>
  screen.getByRole("searchbox", { name: "Search Articles" });

// Two controls answer to `Clear search`: the one inside the field, and the one
// an Empty state offers. They do the same thing; the Empty's is the later one.
const emptyClearSearch = (): HTMLElement => {
  const control = screen
    .getAllByRole("button", { name: "Clear search" })
    .at(-1);

  if (control === undefined) {
    throw new TypeError("Expected an Empty state to offer Clear search.");
  }

  return control;
};

const marksIn = (element: Element) =>
  [...element.querySelectorAll("mark")].map((mark) => mark.textContent);

const tagValues = () =>
  screen.getAllByRole("radio").map((option) => option.getAttribute("value"));

const lastUpdate = (onUrlUpdate: ReturnType<typeof vi.fn>) =>
  onUrlUpdate.mock.calls.at(-1)?.[0] as
    | Parameters<OnUrlUpdateFunction>[0]
    | undefined;

beforeEach(async () => {
  const search = await searchOver(searchDocuments);
  loadArticleSearch.mockImplementation(
    async () => await Promise.resolve(search)
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  cleanup();
  document.body.replaceChildren();
});

describe("server-rendered Blog catalog", () => {
  test("links every visible Article before hydration", () => {
    const { container } = renderServer(threeArticles);
    const links = within(container).getAllByRole("link");

    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/blog/cache",
      "/blog/budgets",
      "/blog/seams",
    ]);
  });

  test("prerenders the discovery controls disabled and unfiltered", () => {
    const { container } = renderServer(threeArticles);
    const search = within(container).getByRole("searchbox", {
      name: "Search Articles",
    });
    const radios = within(container).getAllByRole("radio");

    expect(search).toHaveProperty("disabled", true);
    expect(radios).toHaveLength(TAG_FACETS.length + 1);
    expect(radios.every((option) => option.hasAttribute("disabled"))).toBe(
      true
    );
    expect(
      within(container).getByRole("radio", { name: "All 3 Articles" })
    ).toHaveProperty("checked", true);
  });

  test("explains that discovery needs JavaScript", () => {
    const { container } = renderServer(threeArticles);

    expect(container.querySelector("noscript")?.textContent).toContain(
      "Article search and Tag filtering need JavaScript"
    );
  });

  test("drops the discovery controls from an empty catalog", () => {
    const { container, markup } = renderServer([]);

    expect(within(container).getByText("Fresh page, no ink yet")).toBeTruthy();
    expect(within(container).queryByRole("searchbox")).toBeNull();
    expect(within(container).queryAllByRole("radio")).toHaveLength(0);
    expect(markup).not.toContain("<noscript>");
  });
});

describe("Blog catalog cards", () => {
  test("exposes one Article link named by the complete title", () => {
    const longTitle =
      "A performance budget that survives contact with a real editorial calendar";

    renderHydrated([publishedArticle({ slug: "budget", title: longTitle })]);

    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(1);
    expect(links[0]).toHaveProperty("textContent", longTitle);
  });

  test("renders a machine-readable publication date", () => {
    renderHydrated([
      publishedArticle({ publishedAt: "2026-07-28", slug: "cache" }),
    ]);

    const published = screen.getByText("28.07.2026");

    expect(published.tagName).toBe("TIME");
    expect(published.getAttribute("datetime")).toBe("2026-07-28");
    expect(screen.getByText("Published on")).toBeTruthy();
  });

  test("reserves the Cover's layout and keeps it decorative", () => {
    const { container } = renderHydrated([publishedArticle({ slug: "cache" })]);
    const cover = container.querySelector("img");

    expect(cover?.getAttribute("width")).toBe("1200");
    expect(cover?.getAttribute("height")).toBe("630");
    expect(cover?.getAttribute("alt")).toBe("");
    expect(cover?.getAttribute("sizes")).toBeTruthy();
  });

  test("reports a local Draft as unpublished whatever date it carries", () => {
    renderHydrated([draftArticle({ publishedAt: "2027-01-01", slug: "wip" })]);

    expect(screen.getByText("Not published")).toBeTruthy();
    expect(screen.getByText("Draft")).toBeTruthy();
    expect(screen.queryByText("01.01.2027")).toBeNull();
  });

  test("renders one card per Article", () => {
    renderHydrated(threeArticles);

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  test("leaves the page main to the app shell", () => {
    renderHydrated(threeArticles);

    expect(screen.queryByRole("main")).toBeNull();
  });
});

describe("hydrated discovery controls", () => {
  test("enables the search field and the Tag filter", async () => {
    renderHydrated(threeArticles);

    const search = await screen.findByRole("searchbox", {
      name: "Search Articles",
    });

    expect(search).toHaveProperty("disabled", false);
    expect(
      screen
        .getAllByRole("radio")
        .every((option) => !option.hasAttribute("disabled"))
    ).toBe(true);
  });

  test("counts Articles in words, not as a bare number", () => {
    renderHydrated(threeArticles);

    expect(radio("All 3 Articles")).toBeTruthy();
    expect(radio("Web performance 1 Article")).toBeTruthy();
  });

  // Clearing hides the Clear control, so a naive handler leaves focus on a
  // `display:none` button and the visitor lands back on the document.
  test("returns focus to the field after the Clear control is used", async () => {
    const user = userEvent.setup();

    renderHydrated(threeArticles);

    const search = await screen.findByRole("searchbox", {
      name: "Search Articles",
    });

    await user.type(search, "cache");
    await user.click(screen.getByRole("button", { name: "Clear search" }));

    expect(search).toHaveProperty("value", "");
    expect(document.activeElement).toBe(search);
  });

  test("clears the query with Escape and keeps the field focused", async () => {
    const user = userEvent.setup();

    renderHydrated(threeArticles);

    const search = await screen.findByRole("searchbox", {
      name: "Search Articles",
    });

    await user.type(search, "cache");
    expect(search).toHaveProperty("value", "cache");

    await user.keyboard("{Escape}");

    expect(search).toHaveProperty("value", "");
    expect(document.activeElement).toBe(search);
  });
});

describe("Tag filter", () => {
  test("offers All and every Tag as one radio group with a single selection", () => {
    renderHydrated(taggedArticles);

    const group = screen.getByRole("radiogroup", {
      name: "Filter Articles by Tag",
    });
    const options = within(group).getAllByRole("radio");

    expect(options.map((option) => option.getAttribute("value"))).toEqual([
      "all",
      "nextjs",
      "web-performance",
    ]);
    expect(
      options.filter((option) => (option as HTMLInputElement).checked)
    ).toHaveLength(1);
    expect(radio("All 3 Articles")).toHaveProperty("checked", true);
  });

  test("counts the whole catalog, so multi-Tag counts need not sum", () => {
    renderHydrated(taggedArticles);

    expect(radio("All 3 Articles")).toBeTruthy();
    expect(radio("Next.js 2 Articles")).toBeTruthy();
    expect(radio("Web performance 1 Article")).toBeTruthy();
  });

  test("narrows the catalog without reordering it", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles);

    expect(hrefsOf()).toEqual(["/blog/cache", "/blog/budgets", "/blog/seams"]);

    await user.click(radio("Next.js 2 Articles"));

    expect(hrefsOf()).toEqual(["/blog/cache", "/blog/budgets"]);
    expect(radio("Next.js 2 Articles")).toHaveProperty("checked", true);
  });

  test("keeps the counts catalog-wide once a Tag is selected", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles);

    await user.click(radio("Next.js 2 Articles"));

    expect(radio("All 3 Articles")).toBeTruthy();
    expect(radio("Web performance 1 Article")).toBeTruthy();
  });

  test("keeps a filtered Draft visible with its Draft treatment", async () => {
    const user = userEvent.setup();

    renderHydrated([
      draftArticle({ slug: "wip", tags: [NEXTJS], title: "Work in progress" }),
      publishedArticle({ slug: "budgets", tags: [NEXTJS] }),
      publishedArticle({ slug: "seams" }),
    ]);

    await user.click(radio("Next.js 2 Articles"));

    expect(hrefsOf()).toEqual(["/blog/wip", "/blog/budgets"]);
    expect(screen.getByText("Draft")).toBeTruthy();
    expect(screen.getByText("Not published")).toBeTruthy();
  });

  test("clears only the Tag when All is chosen", async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    const user = userEvent.setup();

    renderHydrated(taggedArticles, {
      onUrlUpdate,
      searchParams: "?tag=nextjs&q=cache",
    });

    await user.click(radio("All 3 Articles"));

    await waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalled();
    });

    const { queryString } = onUrlUpdate.mock.calls.at(-1)?.[0] ?? {};

    expect(queryString).toBe("?q=cache");
    // The query outlives the Tag it was combined with.
    await waitFor(() => {
      expect(hrefsOf()).toEqual(["/blog/cache"]);
    });
  });

  test("writes the Tag to the URL without adding a history entry", async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    const user = userEvent.setup();

    renderHydrated(taggedArticles, { onUrlUpdate });

    await user.click(radio("Next.js 2 Articles"));

    await waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalled();
    });

    const update = onUrlUpdate.mock.calls.at(-1)?.[0];

    expect(update?.queryString).toBe("?tag=nextjs");
    expect(update?.options.history).toBe("replace");
    expect(update?.options.shallow).toBe(true);
  });

  test("degrades an unknown Tag to All and drops it from the URL", async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();

    // `hasMemory` re-renders the adapter on mount, and the adapter clears the
    // pending update queue on every render — which would swallow the very
    // update this test is about. The real adapter has no such reset.
    renderHydrated(taggedArticles, {
      hasMemory: false,
      onUrlUpdate,
      searchParams: "?tag=kubernetes&q=cache",
    });

    expect(radio("All 3 Articles")).toHaveProperty("checked", true);

    await waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalled();
    });

    expect(onUrlUpdate.mock.calls.at(-1)?.[0].queryString).toBe("?q=cache");
  });

  test("restores a Tag the URL already carries", () => {
    renderHydrated(taggedArticles, { searchParams: "?tag=nextjs" });

    expect(radio("Next.js 2 Articles")).toHaveProperty("checked", true);
    expect(hrefsOf()).toEqual(["/blog/cache", "/blog/budgets"]);
  });
});

describe("Tag filter keyboard behaviour", () => {
  test("selects the next and previous option with the arrow keys", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles);

    radio("All 3 Articles").focus();
    await user.keyboard("{ArrowRight}");

    expect(radio("Next.js 2 Articles")).toHaveProperty("checked", true);
    expect(document.activeElement).toBe(radio("Next.js 2 Articles"));

    await user.keyboard("{ArrowLeft}");

    expect(radio("All 3 Articles")).toHaveProperty("checked", true);
    expect(document.activeElement).toBe(radio("All 3 Articles"));
  });

  test("wraps around the ends of the group", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles);

    radio("All 3 Articles").focus();
    await user.keyboard("{ArrowUp}");

    expect(radio("Web performance 1 Article")).toHaveProperty("checked", true);
  });

  test("reaches the first and last option with Home and End", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles);

    radio("All 3 Articles").focus();
    await user.keyboard("{End}");

    expect(radio("Web performance 1 Article")).toHaveProperty("checked", true);
    expect(document.activeElement).toBe(radio("Web performance 1 Article"));

    await user.keyboard("{Home}");

    expect(radio("All 3 Articles")).toHaveProperty("checked", true);
    expect(document.activeElement).toBe(radio("All 3 Articles"));
  });

  test("gives the group a single tab stop", () => {
    renderHydrated(taggedArticles, { searchParams: "?tag=nextjs" });

    expect(
      screen
        .getAllByRole("radio")
        .filter((option) => option.getAttribute("tabindex") === "0")
        .map((option) => option.getAttribute("value"))
    ).toEqual(["nextjs"]);
  });

  test("keeps focus on the chosen Tag rather than moving it to the results", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles);

    await user.click(radio("Next.js 2 Articles"));

    expect(document.activeElement).toBe(radio("Next.js 2 Articles"));
  });

  test("announces the result count as soon as the Tag changes", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles);

    await user.click(radio("Next.js 2 Articles"));

    expect(
      await screen.findByText("2 Articles found in Next.js.")
    ).toBeTruthy();

    await user.click(radio("All 3 Articles"));

    expect(await screen.findByText("3 Articles found.")).toBeTruthy();
  });
});

describe("Tags that match nothing", () => {
  const emptyFacets: readonly ArticleTagFacet[] = [
    { ...NEXTJS, articleCount: 0 },
    { ...WEB_PERFORMANCE, articleCount: 0 },
  ];

  test("disables a zero-count Tag but never the selected one", () => {
    renderHydrated(threeArticles, {
      searchParams: "?tag=nextjs",
      tags: emptyFacets,
    });

    expect(radio("Next.js 0 Articles")).toHaveProperty("disabled", false);
    expect(radio("Web performance 0 Articles")).toHaveProperty(
      "disabled",
      true
    );
  });

  test("skips a disabled Tag when the arrow keys move", async () => {
    const user = userEvent.setup();

    renderHydrated(threeArticles, {
      searchParams: "?tag=nextjs",
      tags: emptyFacets,
    });

    radio("Next.js 0 Articles").focus();
    await user.keyboard("{ArrowRight}");

    expect(radio("All 3 Articles")).toHaveProperty("checked", true);
  });

  test("offers a way out of a Tag with no Articles", async () => {
    const user = userEvent.setup();

    renderHydrated(threeArticles, {
      searchParams: "?tag=nextjs",
      tags: emptyFacets,
    });

    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getByText("Nothing filed under Next.js")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Show all Tags" }));

    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(document.activeElement).toBe(radio("All 3 Articles"));
  });
});

describe("lazy Article search", () => {
  test("loads nothing until the first effective character is typed", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles);

    const search = searchBox();

    await user.click(search);
    expect(loadArticleSearch).not.toHaveBeenCalled();

    await user.type(search, "   ");
    expect(loadArticleSearch).not.toHaveBeenCalled();
    expect(hrefsOf()).toHaveLength(3);

    await user.type(search, "cache");
    await waitFor(() => {
      expect(hrefsOf()).toEqual(["/blog/cache"]);
    });
    expect(loadArticleSearch).toHaveBeenCalledOnce();
  });

  test("searches every later keystroke without loading again", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles);

    await user.type(searchBox(), "cache");
    await waitFor(() => {
      expect(hrefsOf()).toEqual(["/blog/cache"]);
    });

    await user.clear(searchBox());
    await user.type(searchBox(), "spreadsheet");

    await waitFor(() => {
      expect(hrefsOf()).toEqual(["/blog/budgets"]);
    });
    expect(loadArticleSearch).toHaveBeenCalledOnce();
  });

  test("restores a query the URL already carries", async () => {
    renderHydrated(taggedArticles, { searchParams: "?q=spreadsheet" });

    expect(searchBox()).toHaveProperty("value", "spreadsheet");
    await waitFor(() => {
      expect(hrefsOf()).toEqual(["/blog/budgets"]);
    });
  });

  test("orders results by relevance and never reorders them for a Tag", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles);

    await user.type(searchBox(), "next.js");
    await waitFor(() => {
      expect(hrefsOf()).toEqual(["/blog/budgets", "/blog/cache"]);
    });

    await user.click(radio("Next.js 2 Articles"));

    expect(hrefsOf()).toEqual(["/blog/budgets", "/blog/cache"]);
  });

  test("combines the query and the Tag with AND semantics", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles, { searchParams: "?tag=web-performance" });

    await user.type(searchBox(), "next.js");

    await waitFor(() => {
      expect(hrefsOf()).toEqual(["/blog/cache"]);
    });
  });

  test("never shows an Article the visible catalog did not send", async () => {
    const user = userEvent.setup();
    const withStaleDocument = await searchOver([
      ...searchDocuments,
      searchDocument({
        slug: "unpublished",
        title: "Understanding cache internals",
      }),
    ]);

    loadArticleSearch.mockImplementation(
      async () => await Promise.resolve(withStaleDocument)
    );
    renderHydrated(taggedArticles);

    await user.type(searchBox(), "cache");

    await waitFor(() => {
      expect(hrefsOf()).toEqual(["/blog/cache"]);
    });
    expect(screen.queryByText("Understanding cache internals")).toBeNull();
  });

  test("keeps a matching Draft's Draft treatment", async () => {
    const user = userEvent.setup();
    const search = await searchOver([
      searchDocument({
        slug: "wip",
        status: "draft",
        title: "Understanding cache components",
      }),
    ]);

    loadArticleSearch.mockImplementation(
      async () => await Promise.resolve(search)
    );
    renderHydrated([
      draftArticle({
        publishedAt: "2027-01-01",
        slug: "wip",
        title: "Understanding cache components",
      }),
    ]);

    await user.type(searchBox(), "cache");

    expect(await screen.findByText("Draft")).toBeTruthy();
    expect(screen.getByText("Not published")).toBeTruthy();
    expect(screen.queryByText("01.01.2027")).toBeNull();
  });
});

describe("explained Article search results", () => {
  test("highlights the matching part of a title", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles);

    await user.type(searchBox(), "cache");
    await waitFor(() => {
      expect(hrefsOf()).toEqual(["/blog/cache"]);
    });

    const heading = screen.getByRole("heading", {
      name: "Understanding cache components",
    });

    expect(marksIn(heading)).toEqual(["cache"]);
  });

  test("explains a heading-only match with the matching section", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles);

    await user.type(searchBox(), "injecting");
    await waitFor(() => {
      expect(hrefsOf()).toEqual(["/blog/seams"]);
    });

    const excerpt = screen.getByText("Matching section:").parentElement;

    expect(excerpt?.textContent).toContain("Injecting a fetch");
    expect(marksIn(excerpt as Element)).not.toHaveLength(0);
  });

  test("explains a body-only match with a bounded excerpt", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles);

    await user.type(searchBox(), "spreadsheet");
    await waitFor(() => {
      expect(hrefsOf()).toEqual(["/blog/budgets"]);
    });

    const excerpt = screen.getByText("Matching excerpt:").parentElement;

    expect(excerpt?.textContent).toContain(
      "Every image budget dies in a spreadsheet."
    );
    expect(marksIn(excerpt as Element)).toEqual(["spreadsheet"]);
  });

  test("leaves an unmatched description unmarked", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles);

    await user.type(searchBox(), "web performance");
    await waitFor(() => {
      expect(hrefsOf()).toEqual(["/blog/cache"]);
    });

    const description = screen.getByText("A representative Article.");

    expect(marksIn(description)).toEqual([]);
    expect(screen.queryByText("Matching excerpt:")).toBeNull();
  });

  test("explains a Tag-only match in the facet strip", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles);

    await user.type(searchBox(), "web performance");
    await waitFor(() => {
      expect(hrefsOf()).toEqual(["/blog/cache"]);
    });

    const group = screen.getByRole("radiogroup", {
      name: "Filter Articles by Tag",
    });

    // One mark per token, and only on the Tag the query actually matched.
    expect(marksIn(group)).toEqual(["Web", "performance"]);
  });
});

describe("query-relative Tag counts", () => {
  test("counts query matches independently of the selected Tag", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles);

    await user.type(searchBox(), "next.js");
    await waitFor(() => {
      expect(hrefsOf()).toHaveLength(2);
    });

    expect(radio("All 2 Articles")).toBeTruthy();
    expect(radio("Next.js 2 Articles")).toBeTruthy();
    expect(radio("Web performance 1 Article")).toBeTruthy();

    await user.click(radio("Web performance 1 Article"));

    // Selecting a Tag narrows the cards, never the counts beside the options.
    expect(hrefsOf()).toEqual(["/blog/cache"]);
    expect(radio("All 2 Articles")).toBeTruthy();
    expect(radio("Next.js 2 Articles")).toBeTruthy();
  });

  test("keeps every option in place and returns to catalog counts on clear", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles);

    await user.type(searchBox(), "spreadsheet");
    await waitFor(() => {
      expect(hrefsOf()).toEqual(["/blog/budgets"]);
    });

    expect(tagValues()).toEqual(["all", "nextjs", "web-performance"]);
    expect(radio("Web performance 0 Articles")).toHaveProperty(
      "disabled",
      true
    );

    await user.click(screen.getByRole("button", { name: "Clear search" }));

    expect(radio("All 3 Articles")).toBeTruthy();
    expect(radio("Web performance 1 Article")).toHaveProperty(
      "disabled",
      false
    );
  });
});

describe("shareable query state", () => {
  test("writes a normalized query to the URL without adding a history entry", async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    const user = userEvent.setup();

    renderHydrated(taggedArticles, { onUrlUpdate });

    // One committed edit rather than twenty keystrokes: the contract here is
    // what a settled query looks like in the URL, and the adapter coalesces a
    // burst of writes into an arbitrary subset of them.
    await user.click(searchBox());
    await user.paste("  Cache   Components");

    await waitFor(() => {
      expect(lastUpdate(onUrlUpdate)?.searchParams.get("q")).toBe(
        "Cache Components"
      );
    });

    const update = lastUpdate(onUrlUpdate);

    expect(update?.options.history).toBe("replace");
    expect(update?.options.shallow).toBe(true);
  });

  test("keeps one trailing space in the field and none in the URL", async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    const user = userEvent.setup();

    renderHydrated(taggedArticles, { onUrlUpdate });

    const field = searchBox();

    await user.type(field, "cache ");

    expect(field).toHaveProperty("value", "cache ");
    await waitFor(() => {
      expect(lastUpdate(onUrlUpdate)?.searchParams.get("q")).toBe("cache");
    });

    await user.tab();

    expect(field).toHaveProperty("value", "cache");
  });

  test("ignores pasted text past the accepted query boundary", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles);

    const field = searchBox();

    await user.click(field);
    await user.paste("a".repeat(260));

    expect((field as HTMLInputElement).value).toHaveLength(200);
  });

  test("clears only the query with Escape and keeps the Tag", async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    const user = userEvent.setup();

    renderHydrated(taggedArticles, {
      onUrlUpdate,
      searchParams: "?tag=nextjs",
    });

    const field = searchBox();

    await user.type(field, "cache");
    await user.keyboard("{Escape}");

    expect(field).toHaveProperty("value", "");
    expect(document.activeElement).toBe(field);
    await waitFor(() => {
      expect(lastUpdate(onUrlUpdate)?.queryString).toBe("?tag=nextjs");
    });
  });
});

describe("Article search loading and recovery", () => {
  test("does not flash the loading state when the search settles quickly", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles);

    await user.type(searchBox(), "cache");

    expect(screen.queryByText("Leafing through the Blog…")).toBeNull();
    await waitFor(() => {
      expect(hrefsOf()).toEqual(["/blog/cache"]);
    });
    expect(screen.queryByText("Leafing through the Blog…")).toBeNull();
  });

  test("keeps the cards until the loading state has earned its place", async () => {
    const ready = await searchOver(searchDocuments);
    const pending = Promise.withResolvers<ArticleSearch>();

    loadArticleSearch.mockImplementation(async () => await pending.promise);

    const user = userEvent.setup();

    renderHydrated(taggedArticles);
    await user.type(searchBox(), "cache");

    // The previous catalog stays put while the artifact is in flight, and the
    // strip says so rather than changing any chip's width.
    expect(hrefsOf()).toHaveLength(3);
    expect(screen.queryByText("Leafing through the Blog\u2026")).toBeNull();
    expect(radio("All 3 Articles")).toBeTruthy();
    expect(
      screen
        .getByRole("radiogroup", { name: "Filter Articles by Tag" })
        .getAttribute("aria-busy")
    ).toBe("true");

    expect(
      await screen.findByText("Leafing through the Blog\u2026")
    ).toBeTruthy();

    pending.resolve(ready);

    await waitFor(() => {
      expect(hrefsOf()).toEqual(["/blog/cache"]);
    });
  });

  test("latches a load failure and preserves the query, Tag, facets and focus", async () => {
    loadArticleSearch.mockRejectedValue(new Error("offline"));

    const user = userEvent.setup();

    renderHydrated(taggedArticles, { searchParams: "?tag=nextjs" });

    const field = searchBox();

    await user.type(field, "cache");

    expect(await screen.findByText("Search lost the plot")).toBeTruthy();
    expect(loadArticleSearch).toHaveBeenCalledOnce();

    await user.type(field, "s");

    // Latched: the visitor keeps typing, the failure does not multiply.
    expect(loadArticleSearch).toHaveBeenCalledOnce();
    expect(field).toHaveProperty("value", "caches");
    expect(document.activeElement).toBe(field);
    expect(radio("Next.js 2 Articles")).toHaveProperty("checked", true);
    expect(radio("All 3 Articles")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toBe(
      "Article search could not be loaded."
    );

    await user.click(emptyClearSearch());

    expect(field).toHaveProperty("value", "");
    expect(document.activeElement).toBe(field);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(hrefsOf()).toEqual(["/blog/cache", "/blog/budgets"]);
  });

  test("recovers through Retry search and returns focus to the field", async () => {
    const ready = await searchOver(searchDocuments);

    loadArticleSearch
      .mockRejectedValueOnce(new Error("offline"))
      .mockImplementation(async () => await Promise.resolve(ready));

    const user = userEvent.setup();

    renderHydrated(taggedArticles);
    await user.type(searchBox(), "cache");

    await user.click(
      await screen.findByRole("button", { name: "Retry search" })
    );

    await waitFor(() => {
      expect(hrefsOf()).toEqual(["/blog/cache"]);
    });
    expect(loadArticleSearch).toHaveBeenCalledTimes(2);
    expect(document.activeElement).toBe(searchBox());
  });

  test("clears only the named constraint from a no-results state", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles, { searchParams: "?tag=nextjs" });

    await user.type(searchBox(), "kubernetes");

    expect(
      await screen.findByText("No luck with ‘kubernetes’ in Next.js")
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Show all Tags" }));

    expect(searchBox()).toHaveProperty("value", "kubernetes");
    expect(radio("All 0 Articles")).toHaveProperty("checked", true);
    expect(document.activeElement).toBe(radio("All 0 Articles"));
    expect(screen.getByText("No luck with ‘kubernetes’")).toBeTruthy();

    await user.click(emptyClearSearch());

    expect(searchBox()).toHaveProperty("value", "");
    expect(document.activeElement).toBe(searchBox());
    expect(hrefsOf()).toHaveLength(3);
  });
});

describe("result announcements", () => {
  test("waits for typing to settle before announcing the count", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles);
    await user.type(searchBox(), "cache");

    await waitFor(() => {
      expect(hrefsOf()).toEqual(["/blog/cache"]);
    });

    // Cards first, words later: the count is not read out on the keystroke
    // that produced it.
    expect(
      screen.queryByText("1 Article found for \u2018cache\u2019.")
    ).toBeNull();
    expect(
      await screen.findByText("1 Article found for \u2018cache\u2019.")
    ).toBeTruthy();
  });

  test("names the query and the Tag together and counts zero", async () => {
    const user = userEvent.setup();

    renderHydrated(taggedArticles, { searchParams: "?tag=web-performance" });

    await user.type(searchBox(), "kubernetes");

    expect(
      await screen.findByText(
        "0 Articles found for ‘kubernetes’ in Web performance."
      )
    ).toBeTruthy();
  });
});
