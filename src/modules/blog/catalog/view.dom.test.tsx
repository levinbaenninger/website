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
import { afterEach, describe, expect, test, vi } from "vite-plus/test";

import type {
  ArticleSummary,
  ArticleTagFacet,
} from "@/modules/blog/articles/types";

import {
  draftArticle,
  NEXTJS,
  publishedArticle,
  TAG_FACETS,
  WEB_PERFORMANCE,
} from "./test-fixtures";
import { BlogView } from "./view";

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

const hrefsOf = () =>
  screen.getAllByRole("link").map((link) => link.getAttribute("href"));

const radio = (name: string) => screen.getByRole("radio", { name });

afterEach(() => {
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

    expect(hrefsOf()).toHaveLength(3);
    await waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalled();
    });

    const { queryString } = onUrlUpdate.mock.calls.at(-1)?.[0] ?? {};

    expect(queryString).toBe("?q=cache");
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
    expect(hrefsOf()).toHaveLength(3);

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

    expect(screen.getByText("2 Articles found in Next.js.")).toBeTruthy();

    await user.click(radio("All 3 Articles"));

    expect(screen.getByText("3 Articles found.")).toBeTruthy();
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
