import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vite-plus/test";

import {
  ArticleAccordion,
  ArticleAccordionItem,
  ArticleTab,
  ArticleTabs,
} from "./interactions";

const scrollIntoViewMock = vi.fn(
  (_options?: boolean | ScrollIntoViewOptions): void => undefined
);

describe("Article interactions", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    window.requestAnimationFrame = (callback) => {
      callback(0);
      return 1;
    };
    HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
    scrollIntoViewMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("keeps Accordion items independent and honors authored defaults", async () => {
    const user = userEvent.setup();
    render(
      <ArticleAccordion>
        <ArticleAccordionItem defaultOpen title="Open">
          <p>First body</p>
        </ArticleAccordionItem>
        <ArticleAccordionItem title="Closed">
          <p>Second body</p>
        </ArticleAccordionItem>
      </ArticleAccordion>
    );
    const panels = document.querySelectorAll<HTMLElement>(
      "[data-article-panel='accordion']"
    );

    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(panels).toHaveLength(2);
    expect(panels[0]?.hidden).toBe(false);
    expect(panels[1]?.hidden).toBe(true);

    await user.click(screen.getByRole("button", { name: "Closed" }));

    expect(panels[0]?.hidden).toBe(false);
    expect(panels[1]?.hidden).toBe(false);
  });

  test("selects the first general Tab without persistence or synchronization", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("blog:tabs", "unrelated-preference");
    render(
      <>
        <ArticleTabs>
          <ArticleTab title="First">
            <p>First panel</p>
          </ArticleTab>
          <ArticleTab title="Second">
            <p>Second panel</p>
          </ArticleTab>
        </ArticleTabs>
        <ArticleTabs>
          <ArticleTab title="First">Independent first panel</ArticleTab>
          <ArticleTab title="Second">Independent second panel</ArticleTab>
        </ArticleTabs>
      </>
    );
    const tabs = document.querySelectorAll<HTMLElement>("[role='tab']");
    const panels = document.querySelectorAll<HTMLElement>(
      "[data-article-panel='tab']"
    );

    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");
    expect(panels[0]?.hidden).toBe(false);
    expect(panels[1]?.hidden).toBe(true);

    const [firstTablist] = screen.getAllByRole("tablist");
    await user.click(within(firstTablist).getByRole("tab", { name: "Second" }));

    expect(tabs[1]?.getAttribute("aria-selected")).toBe("true");
    expect(tabs[2]?.getAttribute("aria-selected")).toBe("true");
    expect(window.localStorage.getItem("blog:tabs")).toBe(
      "unrelated-preference"
    );
  });

  test("reveals a hash target during initial navigation", async () => {
    window.history.replaceState(null, "", "#initial-heading");

    const { container } = render(
      <ArticleTabs>
        <ArticleTab title="Visible">Visible</ArticleTab>
        <ArticleTab title="Hidden">
          <h2 id="initial-heading">Initial heading</h2>
        </ArticleTab>
      </ArticleTabs>
    );

    await waitFor(() => {
      expect(
        container.querySelector<HTMLElement>(
          "[data-article-panel='tab']:has(#initial-heading)"
        )?.hidden
      ).toBe(false);
    });
    expect(scrollIntoViewMock).toHaveBeenCalled();
  });

  test("reveals nested panels outermost-first on later hash changes", async () => {
    const { container } = render(
      <ArticleTabs>
        <ArticleTab title="Visible">Visible</ArticleTab>
        <ArticleTab title="Hidden">
          <ArticleAccordion>
            <ArticleAccordionItem title="Closed">
              <h2 id="deep-heading">Deep heading</h2>
            </ArticleAccordionItem>
          </ArticleAccordion>
        </ArticleTab>
      </ArticleTabs>
    );
    const [, tab] = container.querySelectorAll<HTMLElement>("[role='tab']");
    const accordion = container.querySelector<HTMLElement>(
      "[data-article-accordion-trigger]"
    );
    const revealOrder: string[] = [];
    tab?.addEventListener("click", () => {
      revealOrder.push("tab");
    });
    accordion?.addEventListener("click", () => {
      revealOrder.push("accordion");
    });
    scrollIntoViewMock.mockClear();

    window.history.replaceState(null, "", "#deep-heading");
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await waitFor(() => {
      expect(revealOrder).toEqual(["tab", "accordion"]);
    });
    expect(
      container.querySelector<HTMLElement>(
        "[data-article-panel='tab']:has(#deep-heading)"
      )?.hidden
    ).toBe(false);
    expect(
      container.querySelector<HTMLElement>("[data-article-panel='accordion']")
        ?.hidden
    ).toBe(false);
    expect(scrollIntoViewMock).toHaveBeenCalled();
  });
});
