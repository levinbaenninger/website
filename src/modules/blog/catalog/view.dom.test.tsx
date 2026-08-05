import { cleanup, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";

import type { ArticleSummary } from "@/modules/blog/articles/types";

import { draftArticle, publishedArticle, TAG_FACETS } from "./test-fixtures";
import { BlogView } from "./view";

// The prerender: `renderToStaticMarkup` runs no effects, so this is exactly
// the catalog a visitor receives before — or without — any JavaScript.
const renderServer = (articles: readonly ArticleSummary[]) => {
  const markup = renderToStaticMarkup(
    <BlogView articles={articles} tags={TAG_FACETS} />
  );
  const container = document.createElement("div");

  container.innerHTML = markup;
  document.body.append(container);

  return { container, markup };
};

const renderHydrated = (articles: readonly ArticleSummary[]) =>
  render(<BlogView articles={articles} tags={TAG_FACETS} />);

const threeArticles = [
  publishedArticle({ slug: "cache", title: "Understanding cache components" }),
  publishedArticle({ slug: "budgets", title: "Budgeting images" }),
  publishedArticle({ slug: "seams", title: "Seams worth testing" }),
];

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

  test("prerenders the discovery controls disabled", () => {
    const { container } = renderServer(threeArticles);
    const search = within(container).getByRole("searchbox", {
      name: "Search Articles",
    });
    const radios = within(container).getAllByRole("radio");

    expect(search).toHaveProperty("disabled", true);
    expect(radios).toHaveLength(TAG_FACETS.length + 1);
    expect(radios.every((radio) => radio.hasAttribute("disabled"))).toBe(true);
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
    const { container } = render(
      <BlogView
        articles={[publishedArticle({ slug: "cache" })]}
        tags={TAG_FACETS}
      />
    );
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
        .every((radio) => !radio.hasAttribute("disabled"))
    ).toBe(true);
  });

  test("counts Articles in words, not as a bare number", () => {
    renderHydrated(threeArticles);

    expect(screen.getByRole("radio", { name: "All 3 Articles" })).toBeTruthy();
    expect(
      screen.getByRole("radio", { name: "Web performance 1 Article" })
    ).toBeTruthy();
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
