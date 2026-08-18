import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vite-plus/test";

import type {
  ArticleDetail,
  ArticleOutlineHeading,
  ArticleReaderNavigation,
} from "@/features/blog/articles/types";
import {
  ArticleAccordion,
  ArticleAccordionItem,
} from "@/features/blog/rendering/interactions";

import { ArticleView } from "./view";

const { playOpen, reducedMotion } = vi.hoisted(() => ({
  playOpen: vi.fn(),
  reducedMotion: { current: false },
}));

// Happy DOM has no Web Audio implementation, and the outline's one sound is a
// behavior this file asserts rather than an incidental effect.
vi.mock(import("@/shared/audio/use-sound"), () => ({
  useSound: () =>
    [
      playOpen,
      {
        duration: null,
        isPlaying: false,
        pause: () => {},
        sound: { dataUri: "", duration: 0 },
        stop: () => {},
      },
    ] as never,
}));

vi.mock(import("motion/react"), async (importOriginal) => ({
  ...(await importOriginal()),
  useReducedMotion: () => reducedMotion.current,
}));

const COVER = { height: 630, src: "/cover.png", width: 1200 };
const NO_NEIGHBOURS: ArticleReaderNavigation = { next: null, previous: null };

const OUTLINE: readonly ArticleOutlineHeading[] = [
  { depth: 2, id: "intro", text: "Introduction" },
  { depth: 3, id: "details", text: "The details" },
  { depth: 2, id: "closing", text: "Closing" },
];

const article = (
  outline: readonly ArticleOutlineHeading[],
  Content: ArticleDetail["Content"]
): ArticleDetail => ({
  Content,
  cover: COVER,
  description: "A representative Article.",
  discovery: {
    cover: COVER,
    description: "A representative Article.",
    href: "/blog/representative-article",
    publishedAt: "2026-08-02",
    tags: [],
    title: "Representative Article",
    updatedAt: null,
  },
  href: "/blog/representative-article",
  navigation: NO_NEIGHBOURS,
  outline,
  publishedAt: "2026-08-02",
  slug: "representative-article",
  status: "published",
  tags: [],
  title: "Representative Article",
  updatedAt: null,
});

const FlatBody = () => (
  <>
    <h2 id="intro">Introduction</h2>
    <p>Opening paragraph.</p>
    <h3 id="details">The details</h3>
    <p>Detail paragraph.</p>
    <h2 id="closing">Closing</h2>
  </>
);

const PanelledBody = () => (
  <>
    <h2 id="intro">Introduction</h2>
    <ArticleAccordion panels='[{"label":"Deep dive","value":"accordion-item-0","defaultOpen":false}]'>
      <ArticleAccordionItem value="accordion-item-0">
        <h3 id="details">The details</h3>
      </ArticleAccordionItem>
    </ArticleAccordion>
    <h2 id="closing">Closing</h2>
  </>
);

const renderReader = (
  outline: readonly ArticleOutlineHeading[] = OUTLINE,
  Content: ArticleDetail["Content"] = FlatBody
) => render(<ArticleView article={article(outline, Content)} />);

const outlineCard = (): HTMLElement => {
  const card = document.querySelector<HTMLElement>(
    '[data-slot="article-outline-card"]'
  );

  if (card === null) {
    throw new Error("The reader rendered no outline card.");
  }

  return card;
};

const minimapTrigger = () => {
  const minimap = document.querySelector<HTMLElement>(
    '[data-slot="article-outline-minimap"]'
  );

  if (minimap === null) {
    throw new Error("The reader rendered no minimap.");
  }

  return within(minimap).getByRole("button", { name: "On this page" });
};

// Mobile card: no portal.
const openCard = async (user: ReturnType<typeof userEvent.setup>) => {
  const card = outlineCard();

  await user.click(within(card).getByRole("button", { name: "On this page" }));

  return within(card);
};

const placeHeading = (id: string, top: number) => {
  // eslint-disable-next-line unicorn/prefer-query-selector
  const heading = document.getElementById(id);

  if (heading === null) {
    throw new Error(`The Article rendered no heading ${JSON.stringify(id)}.`);
  }

  vi.spyOn(heading, "getBoundingClientRect").mockReturnValue({
    top,
  } as DOMRect);
};

// Drain the macrotask queue rather than a wall-clock sleep: rAF is stubbed onto zero-delay timers, and a timer queued here is always served after the ones already waiting.
const nextTurn = async () =>
  await new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });

const settle = async () => {
  await act(async () => {
    // One turn per frame the reveal path schedules, and two to spare.
    await nextTurn();
    await nextTurn();
    await nextTurn();
    await nextTurn();
  });
};

const scroll = async () => {
  await act(async () => {
    window.dispatchEvent(new Event("scroll"));
    await Promise.resolve();
  });
};

const scrollIntoViewMock = vi.fn(
  (_options?: boolean | ScrollIntoViewOptions): void => undefined
);

beforeEach(() => {
  window.history.replaceState(null, "", "/blog/representative-article");
  playOpen.mockClear();
  reducedMotion.current = false;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    window.setTimeout(() => {
      callback(0);
    }, 0)
  );
  vi.stubGlobal("cancelAnimationFrame", (handle: number) => {
    window.clearTimeout(handle);
  });
  // The reader's sticky title and every Next.js `Link` observe something; none
  // of it is what this file is about.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      readonly #targets = new Set<Element>();

      observe(target: Element) {
        this.#targets.add(target);
      }

      unobserve(target: Element) {
        this.#targets.delete(target);
      }

      disconnect() {
        this.#targets.clear();
      }
    }
  );
  vi.spyOn(HTMLElement.prototype, "scrollIntoView").mockImplementation(
    scrollIntoViewMock
  );
  scrollIntoViewMock.mockClear();
});

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Article outline presence", () => {
  test("omits both surfaces when the Article has no headings", () => {
    renderReader([]);

    expect(screen.queryByRole("button", { name: "On this page" })).toBeNull();
    expect(
      document.querySelector('[data-slot="article-outline-minimap"]')
    ).toBeNull();
  });

  test("omits both surfaces for a single heading", () => {
    renderReader([{ depth: 2, id: "intro", text: "Introduction" }]);

    expect(screen.queryByRole("button", { name: "On this page" })).toBeNull();
    expect(
      document.querySelector('[data-slot="article-outline-minimap"]')
    ).toBeNull();
  });

  test("offers both surfaces from two headings", () => {
    renderReader();

    expect(
      screen.getAllByRole("button", { name: "On this page" })
    ).toHaveLength(2);
  });
});

describe("Article outline list", () => {
  test("lists every heading in document order with its depth", async () => {
    const user = userEvent.setup();
    renderReader();

    const card = await openCard(user);
    const links = card.getAllByRole("link");

    expect(links.map((link) => link.textContent)).toStrictEqual([
      "Introduction",
      "The details",
      "Closing",
    ]);
    expect(links.map((link) => link.dataset.depth)).toStrictEqual([
      "2",
      "3",
      "2",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toStrictEqual([
      "#intro",
      "#details",
      "#closing",
    ]);
  });

  test("keeps the complete accessible name of a long heading", async () => {
    const user = userEvent.setup();
    const long =
      "A heading long enough that the desktop popover has to clamp it to two visual lines before it fits";
    renderReader([
      { depth: 2, id: "intro", text: "Introduction" },
      { depth: 3, id: "long", text: long },
    ]);

    const card = await openCard(user);

    // Clamping is a visual limit. The name a screen reader announces, and the
    // name this query matches, is the whole heading.
    expect(card.getByRole("link", { name: long }).textContent).toBe(long);
  });

  test("lists a heading inside a closed panel", async () => {
    const user = userEvent.setup();
    renderReader(OUTLINE, PanelledBody);

    const card = await openCard(user);

    expect(card.getByRole("link", { name: "The details" }).textContent).toBe(
      "The details"
    );
  });

  test("encodes a heading ID that is not URL-safe", async () => {
    const user = userEvent.setup();
    renderReader([
      { depth: 2, id: "intro", text: "Introduction" },
      { depth: 2, id: "caché & co", text: "Caché & co" },
    ]);

    const card = await openCard(user);

    expect(
      card.getByRole("link", { name: "Caché & co" }).getAttribute("href")
    ).toBe("#cach%C3%A9%20%26%20co");
  });
});

describe("active Article heading", () => {
  test("marks nothing before the first heading crosses the chrome", async () => {
    const user = userEvent.setup();
    renderReader();
    placeHeading("intro", 400);
    placeHeading("details", 700);
    placeHeading("closing", 900);
    await scroll();

    const card = await openCard(user);

    await waitFor(() => {
      expect(card.queryByRole("link", { current: "location" })).toBeNull();
    });
  });

  test("marks the last heading that has passed under the chrome", async () => {
    const user = userEvent.setup();
    renderReader();
    const card = await openCard(user);

    placeHeading("intro", -300);
    placeHeading("details", 40);
    placeHeading("closing", 800);
    await scroll();

    await waitFor(() => {
      expect(card.getByRole("link", { current: "location" }).textContent).toBe(
        "The details"
      );
    });
  });

  test("keeps the final heading current at the end of the Article", async () => {
    const user = userEvent.setup();
    renderReader();
    const card = await openCard(user);

    placeHeading("intro", -900);
    placeHeading("details", -600);
    placeHeading("closing", -100);
    await scroll();

    await waitFor(() => {
      expect(card.getByRole("link", { current: "location" }).textContent).toBe(
        "Closing"
      );
    });
  });

  test("never makes a heading in a closed panel current", async () => {
    const user = userEvent.setup();
    renderReader(OUTLINE, PanelledBody);
    const card = await openCard(user);

    placeHeading("intro", -300);
    placeHeading("details", -200);
    placeHeading("closing", 800);
    await scroll();

    await waitFor(() => {
      expect(card.getByRole("link", { current: "location" }).textContent).toBe(
        "Introduction"
      );
    });
  });

  test("recalculates once a panel reveals its heading", async () => {
    const user = userEvent.setup();
    renderReader(OUTLINE, PanelledBody);
    const card = await openCard(user);

    placeHeading("intro", -300);
    placeHeading("details", -200);
    placeHeading("closing", 800);
    await scroll();

    await waitFor(() => {
      expect(card.getByRole("link", { current: "location" }).textContent).toBe(
        "Introduction"
      );
    });

    // Opening the panel is neither a scroll nor a resize, and it is exactly
    // what makes the heading inside it reachable.
    await user.click(screen.getByRole("button", { name: "Deep dive" }));

    await waitFor(() => {
      expect(card.getByRole("link", { current: "location" }).textContent).toBe(
        "The details"
      );
    });
  });

  test("leaves the URL alone while a visitor scrolls", async () => {
    renderReader();
    placeHeading("intro", -300);
    placeHeading("details", 40);
    placeHeading("closing", 800);
    await scroll();

    expect(window.location.hash).toBe("");
  });
});

describe("Article outline selection", () => {
  test("reveals the containing panel, records history and focuses the heading", async () => {
    const user = userEvent.setup();
    const { container } = renderReader(OUTLINE, PanelledBody);
    const card = await openCard(user);

    await user.click(card.getByRole("link", { name: "The details" }));

    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalledWith();
    });
    expect(
      container.querySelector<HTMLElement>(
        "[data-article-panel='accordion']:has(#details)"
      )?.hidden
    ).toBeFalsy();
    expect(window.location.hash).toBe("#details");
    // eslint-disable-next-line unicorn/prefer-query-selector
    expect(document.activeElement).toBe(document.getElementById("details"));
  });

  test("scrolls smoothly, and instantly where motion is unwelcome", async () => {
    const user = userEvent.setup();
    renderReader();
    const card = await openCard(user);

    await user.click(card.getByRole("link", { name: "Closing" }));
    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenLastCalledWith({
        behavior: "smooth",
      });
    });

    cleanup();
    reducedMotion.current = true;
    renderReader();
    const reducedCard = await openCard(user);

    await user.click(reducedCard.getByRole("link", { name: "Closing" }));
    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenLastCalledWith({
        behavior: "auto",
      });
    });
  });
});

describe("Article fragment navigation", () => {
  test("reveals and focuses the fragment a visitor arrived on", async () => {
    window.history.replaceState(
      null,
      "",
      "/blog/representative-article#details"
    );
    const { container } = renderReader(OUTLINE, PanelledBody);

    await waitFor(() => {
      expect(
        container.querySelector<HTMLElement>(
          "[data-article-panel='accordion']:has(#details)"
        )?.hidden
      ).toBeFalsy();
      // eslint-disable-next-line unicorn/prefer-query-selector
      expect(document.activeElement).toBe(document.getElementById("details"));
    });
  });

  test("reruns the reveal on a later fragment and on history traversal", async () => {
    const { container } = renderReader(OUTLINE, PanelledBody);
    const panel = () =>
      container.querySelector<HTMLElement>(
        "[data-article-panel='accordion']:has(#details)"
      );

    expect(panel()?.hidden).toBeTruthy();

    await act(async () => {
      window.history.pushState(
        null,
        "",
        "/blog/representative-article#details"
      );
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(panel()?.hidden).toBeFalsy();
    });

    // Restored fragment should get the same reveal as a fresh one.
    scrollIntoViewMock.mockClear();
    await act(async () => {
      window.history.replaceState(null, "", "/blog/representative-article");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      window.history.replaceState(
        null,
        "",
        "/blog/representative-article#details"
      );
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalledWith();
    });
    expect(panel()?.hidden).toBeFalsy();
  });

  test("leaves a malformed or unknown fragment intact and takes no focus", async () => {
    window.history.replaceState(
      null,
      "",
      "/blog/representative-article#%E0%A4"
    );
    renderReader();
    await settle();
    const active = document.activeElement;
    scrollIntoViewMock.mockClear();

    // Not valid percent-encoding, so there is nothing to look up.
    await act(async () => {
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      await Promise.resolve();
    });
    await settle();

    expect(window.location.hash).toBe("#%E0%A4");
    expect(document.activeElement).toBe(active);
    expect(scrollIntoViewMock).not.toHaveBeenCalled();

    // Well-formed, and names nothing in this Article.
    await act(async () => {
      window.history.replaceState(
        null,
        "",
        "/blog/representative-article#gone"
      );
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      await Promise.resolve();
    });
    await settle();

    expect(window.location.hash).toBe("#gone");
    expect(document.activeElement).toBe(active);
    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });
});

describe("Article outline disclosure", () => {
  test("opens the desktop list on click and returns focus on Escape", async () => {
    const user = userEvent.setup();
    renderReader();
    // Nothing has crossed the activation line, so the list opens at its start.
    placeHeading("intro", 400);
    placeHeading("details", 700);
    placeHeading("closing", 900);
    await scroll();
    const trigger = minimapTrigger();

    await user.hover(trigger);
    expect(
      screen.queryByRole("navigation", { name: "On this page" })
    ).toBeNull();

    await user.click(trigger);

    const list = await screen.findByRole("navigation", {
      name: "On this page",
    });
    await waitFor(() => {
      expect(within(list).getByRole("link", { name: "Introduction" })).toBe(
        document.activeElement
      );
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(trigger).toBe(document.activeElement);
    });
  });

  test("opens the desktop list at the heading being read", async () => {
    const user = userEvent.setup();
    renderReader();
    placeHeading("intro", -300);
    placeHeading("details", 40);
    placeHeading("closing", 800);
    await scroll();

    await user.click(minimapTrigger());

    const list = await screen.findByRole("navigation", {
      name: "On this page",
    });
    await waitFor(() => {
      expect(within(list).getByRole("link", { name: "The details" })).toBe(
        document.activeElement
      );
    });
  });

  test("keeps the mobile card open after a selection", async () => {
    const user = userEvent.setup();
    renderReader();
    const card = await openCard(user);

    await user.click(card.getByRole("link", { name: "Closing" }));

    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalledWith();
    });
    expect(card.getByRole("link", { name: "Introduction" }).textContent).toBe(
      "Introduction"
    );
  });

  test("plays the outline sound only on the way open", async () => {
    const user = userEvent.setup();
    renderReader();

    expect(playOpen).not.toHaveBeenCalled();

    const cardTrigger = within(outlineCard()).getByRole("button", {
      name: "On this page",
    });

    await user.click(cardTrigger);
    expect(playOpen).toHaveBeenCalledOnce();

    await user.click(cardTrigger);
    expect(playOpen).toHaveBeenCalledOnce();

    await user.click(minimapTrigger());
    expect(playOpen).toHaveBeenCalledTimes(2);
  });
});
