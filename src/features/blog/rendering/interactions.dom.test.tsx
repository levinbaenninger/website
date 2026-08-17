import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vite-plus/test";

import { ArticleFile, ArticleFiles, ArticleFolder } from "./components";
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
    window.localStorage.clear();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
      window.setTimeout(() => {
        callback(0);
      }, 0)
    );
    vi.spyOn(HTMLElement.prototype, "scrollIntoView").mockImplementation(
      scrollIntoViewMock
    );
    scrollIntoViewMock.mockClear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("keeps Accordion items independent and honors authored defaults", async () => {
    const user = userEvent.setup();
    render(
      <ArticleAccordion panels='[{"label":"Open","value":"accordion-item-0","defaultOpen":true},{"label":"Closed","value":"accordion-item-1","defaultOpen":false}]'>
        <ArticleAccordionItem value="accordion-item-0">
          <p>First body</p>
        </ArticleAccordionItem>
        <ArticleAccordionItem value="accordion-item-1">
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

  test("keeps Accordion labels out of the Article outline", () => {
    const { container } = render(
      <ArticleAccordion panels='[{"label":"Only","value":"accordion-item-0","defaultOpen":false}]'>
        <ArticleAccordionItem value="accordion-item-0">
          <h2 id="authored">Authored heading</h2>
        </ArticleAccordionItem>
      </ArticleAccordion>
    );

    /*
     * Accordion.Header would emit h3 into the outline. The authored heading
     * inside the closed panel stays in the tree so the outline is stable.
     */
    const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
    expect(headings).toHaveLength(1);
    expect(headings[0]?.textContent).toBe("Authored heading");

    const trigger = screen.getByRole("button", { name: "Only" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true"
    );
  });

  test("operates a nested Folder from the keyboard alone", async () => {
    const user = userEvent.setup();
    render(
      <ArticleFiles>
        <ArticleFolder defaultOpen name="app">
          <ArticleFolder name="(marketing)">
            <ArticleFile name="page.tsx" />
          </ArticleFolder>
        </ArticleFolder>
      </ArticleFiles>
    );

    const nested = screen.getByRole("button", { name: "(marketing) folder" });
    expect(nested.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("page.tsx")).toBeNull();

    nested.focus();
    await user.keyboard("{Enter}");

    expect(nested.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("page.tsx")).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  test("selects the first general Tab without persistence or synchronization", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("blog:tabs", "unrelated-preference");
    render(
      <>
        <ArticleTabs panels='[{"label":"First","value":"tab-0"},{"label":"Second","value":"tab-1"}]'>
          <ArticleTab value="tab-0">
            <p>First panel</p>
          </ArticleTab>
          <ArticleTab value="tab-1">
            <p>Second panel</p>
          </ArticleTab>
        </ArticleTabs>
        <ArticleTabs panels='[{"label":"First","value":"tab-0"},{"label":"Second","value":"tab-1"}]'>
          <ArticleTab value="tab-0">Independent first panel</ArticleTab>
          <ArticleTab value="tab-1">Independent second panel</ArticleTab>
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

  test("uses automatic keyboard activation for general Tabs", async () => {
    const user = userEvent.setup();
    render(
      <ArticleTabs panels='[{"label":"First","value":"tab-0"},{"label":"Second","value":"tab-1"}]'>
        <ArticleTab value="tab-0">First body</ArticleTab>
        <ArticleTab value="tab-1">Second body</ArticleTab>
      </ArticleTabs>
    );

    const first = screen.getByRole("tab", { name: "First" });
    const second = screen.getByRole("tab", { name: "Second" });
    await user.click(first);
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).toBe(second);
    expect(second.getAttribute("aria-selected")).toBe("true");
  });

  test("synchronizes until-found reveals with panel state", async () => {
    render(
      <>
        <ArticleAccordion panels='[{"label":"Open","value":"accordion-item-0","defaultOpen":true},{"label":"Found","value":"accordion-item-1","defaultOpen":false}]'>
          <ArticleAccordionItem value="accordion-item-0">
            Open body
          </ArticleAccordionItem>
          <ArticleAccordionItem value="accordion-item-1">
            Found body
          </ArticleAccordionItem>
        </ArticleAccordion>
        <ArticleTabs panels='[{"label":"Visible","value":"tab-0"},{"label":"Found","value":"tab-1"}]'>
          <ArticleTab value="tab-0">Visible body</ArticleTab>
          <ArticleTab value="tab-1">Found tab body</ArticleTab>
        </ArticleTabs>
      </>
    );
    const panels = document.querySelectorAll<HTMLElement>(
      "[data-article-panel='accordion']"
    );

    expect(panels[1]?.getAttribute("hidden")).toBe("until-found");
    panels[1]?.dispatchEvent(new Event("beforematch"));

    await waitFor(() => {
      expect(panels[1]?.hidden).toBe(false);
    });
    expect(panels[0]?.hidden).toBe(false);

    const tabPanels = document.querySelectorAll<HTMLElement>(
      "[data-article-panel='tab']"
    );
    expect(tabPanels[1]?.getAttribute("hidden")).toBe("until-found");
    tabPanels[1]?.dispatchEvent(new Event("beforematch"));

    await waitFor(() => {
      expect(tabPanels[1]?.hidden).toBe(false);
    });
    expect(tabPanels[0]?.hidden).toBe(true);
  });

  test("reveals a hash target during initial navigation", async () => {
    window.history.replaceState(null, "", "#initial-heading");

    const { container } = render(
      <ArticleTabs panels='[{"label":"Visible","value":"tab-0"},{"label":"Hidden","value":"tab-1"}]'>
        <ArticleTab value="tab-0">Visible</ArticleTab>
        <ArticleTab value="tab-1">
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
      expect(scrollIntoViewMock).toHaveBeenCalled();
    });
  });

  test("reveals nested panels before scrolling on later hash changes", async () => {
    const { container } = render(
      <ArticleTabs panels='[{"label":"Visible","value":"tab-0"},{"label":"Hidden","value":"tab-1"}]'>
        <ArticleTab value="tab-0">Visible</ArticleTab>
        <ArticleTab value="tab-1">
          <ArticleAccordion panels='[{"label":"Unrelated","value":"accordion-item-0","defaultOpen":true},{"label":"Closed","value":"accordion-item-1","defaultOpen":false}]'>
            <ArticleAccordionItem value="accordion-item-0">
              Unrelated open body
            </ArticleAccordionItem>
            <ArticleAccordionItem value="accordion-item-1">
              <h2 id="deep-heading">Deep heading</h2>
            </ArticleAccordionItem>
          </ArticleAccordion>
        </ArticleTab>
      </ArticleTabs>
    );
    const revealedControls: string[] = [];
    const recordReveal = (event: Event) => {
      if (event.target instanceof HTMLButtonElement) {
        revealedControls.push(event.target.textContent ?? "");
      }
    };
    document.addEventListener("click", recordReveal);
    scrollIntoViewMock.mockClear();
    scrollIntoViewMock.mockImplementation(() => {
      expect(
        container.querySelector<HTMLElement>(
          "[data-article-panel='tab']:has(#deep-heading)"
        )?.hidden
      ).toBe(false);
      const accordionPanels = container.querySelectorAll<HTMLElement>(
        "[data-article-panel='accordion']"
      );
      expect(accordionPanels[0]?.hidden).toBe(false);
      expect(accordionPanels[1]?.hidden).toBe(false);
    });

    window.history.replaceState(null, "", "#deep-heading");
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalled();
    });
    document.removeEventListener("click", recordReveal);
    expect(
      container.querySelector<HTMLElement>(
        "[data-article-panel='tab']:has(#deep-heading)"
      )?.hidden
    ).toBe(false);
    const accordionPanels = container.querySelectorAll<HTMLElement>(
      "[data-article-panel='accordion']"
    );
    expect(accordionPanels[0]?.hidden).toBe(false);
    expect(accordionPanels[1]?.hidden).toBe(false);
    expect(revealedControls).toEqual(["Hidden", "Closed"]);
    expect(scrollIntoViewMock).toHaveBeenCalled();
  });
});
