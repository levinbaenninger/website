// @vitest-environment happy-dom

import { act } from "react";
import { createRoot } from "react-dom/client";
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
} from "./article-interactions";

const scrollIntoViewMock = vi.fn(
  (_options?: boolean | ScrollIntoViewOptions): void => undefined
);

const renderInteraction = (element: React.ReactNode) => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  act(() => {
    root.render(element);
  });
  return {
    container,
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
};

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
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  test("keeps Accordion items independent and honors authored defaults", () => {
    const view = renderInteraction(
      <ArticleAccordion>
        <ArticleAccordionItem defaultOpen title="Open">
          <p>First body</p>
        </ArticleAccordionItem>
        <ArticleAccordionItem title="Closed">
          <p>Second body</p>
        </ArticleAccordionItem>
      </ArticleAccordion>
    );
    const triggers = view.container.querySelectorAll("button");
    const panels = view.container.querySelectorAll<HTMLElement>(
      "[data-article-panel='accordion']"
    );

    expect(triggers).toHaveLength(2);
    expect(panels).toHaveLength(2);
    expect(panels[0]?.hidden).toBe(false);
    expect(panels[1]?.hidden).toBe(true);

    act(() => {
      triggers[1]?.click();
    });

    expect(panels[0]?.hidden).toBe(false);
    expect(panels[1]?.hidden).toBe(false);
    view.unmount();
  });

  test("selects the first general Tab without persistence or synchronization", () => {
    window.localStorage.setItem("blog:tabs", "unrelated-preference");
    const view = renderInteraction(
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
    const tabs = view.container.querySelectorAll<HTMLElement>("[role='tab']");
    const panels = view.container.querySelectorAll<HTMLElement>(
      "[data-article-panel='tab']"
    );

    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");
    expect(panels[0]?.hidden).toBe(false);
    expect(panels[1]?.hidden).toBe(true);

    act(() => {
      tabs[1]?.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, button: 0 })
      );
      tabs[1]?.click();
    });

    expect(tabs[1]?.getAttribute("aria-selected")).toBe("true");
    expect(tabs[2]?.getAttribute("aria-selected")).toBe("true");
    expect(window.localStorage.getItem("blog:tabs")).toBe(
      "unrelated-preference"
    );
    view.unmount();
  });

  test("reveals a hash target during initial navigation", async () => {
    window.history.replaceState(null, "", "#initial-heading");

    const view = renderInteraction(
      <ArticleTabs>
        <ArticleTab title="Visible">Visible</ArticleTab>
        <ArticleTab title="Hidden">
          <h2 id="initial-heading">Initial heading</h2>
        </ArticleTab>
      </ArticleTabs>
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(
      view.container.querySelector<HTMLElement>(
        "[data-article-panel='tab']:has(#initial-heading)"
      )?.hidden
    ).toBe(false);
    expect(scrollIntoViewMock).toHaveBeenCalled();
    view.unmount();
  });

  test("reveals nested panels outermost-first on later hash changes", async () => {
    const view = renderInteraction(
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
    const [, tab] =
      view.container.querySelectorAll<HTMLElement>("[role='tab']");
    const accordion = view.container.querySelector<HTMLElement>(
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

    await act(async () => {
      window.history.replaceState(null, "", "#deep-heading");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      await Promise.resolve();
    });

    expect(revealOrder).toEqual(["tab", "accordion"]);
    expect(
      view.container.querySelector<HTMLElement>(
        "[data-article-panel='tab']:has(#deep-heading)"
      )?.hidden
    ).toBe(false);
    expect(
      view.container.querySelector<HTMLElement>(
        "[data-article-panel='accordion']"
      )?.hidden
    ).toBe(false);
    expect(scrollIntoViewMock).toHaveBeenCalled();
    view.unmount();
  });
});
