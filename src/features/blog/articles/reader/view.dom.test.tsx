import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";

import type {
  ArticleDetail,
  ArticleOutlineHeading,
  ArticleReaderNavigation,
} from "@/features/blog/articles/types";
import { TooltipProvider } from "@/shared/ui/tooltip";

import { ArticleView } from "./view";

const COVER = { height: 630, src: "/cover.png", width: 1200 };

const NO_NEIGHBOURS: ArticleReaderNavigation = { next: null, previous: null };

const article = ({
  navigation = NO_NEIGHBOURS,
  outline = [],
  publishedAt = "2026-08-02",
  status = "published",
  tags = [],
  title = "Representative Article",
  updatedAt = null,
}: {
  readonly navigation?: ArticleReaderNavigation;
  readonly outline?: readonly ArticleOutlineHeading[];
  readonly publishedAt?: string | null;
  readonly status?: "draft" | "published";
  readonly tags?: readonly { readonly id: string; readonly label: string }[];
  readonly title?: string;
  readonly updatedAt?: string | null;
} = {}): ArticleDetail => {
  const shared = {
    Content: () => <p>Article body</p>,
    cover: COVER,
    description: "A representative Article.",
    href: "/blog/representative-article" as const,
    navigation,
    outline,
    slug: "representative-article",
    tags,
    title,
  };

  if (status === "published") {
    if (publishedAt === null) {
      throw new Error("A Published Article fixture needs a publication date.");
    }

    return {
      ...shared,
      discovery: {
        cover: COVER,
        description: shared.description,
        href: shared.href,
        publishedAt,
        tags,
        title,
        updatedAt,
      },
      publishedAt,
      status: "published",
      updatedAt,
    };
  }

  return {
    ...shared,
    discovery: null,
    publishedAt,
    status: "draft",
    updatedAt,
  };
};

// `renderToStaticMarkup` runs no effects: the reader a visitor receives before any JavaScript.
const renderServer = (
  detail: ArticleDetail,
  canonicalUrl: string | null = null
) => {
  const container = document.createElement("div");

  container.innerHTML = renderToStaticMarkup(
    <TooltipProvider>
      <ArticleView article={detail} canonicalUrl={canonicalUrl} />
    </TooltipProvider>
  );
  document.body.append(container);

  return container;
};

// Happy DOM's IntersectionObserver never reports; the sticky title is a report about scroll position.
const stubIntersectionObserver = () => {
  const original = globalThis.IntersectionObserver;
  let report: ((intersecting: boolean) => void) | null = null;

  // Next.js `Link` observes its own anchors, so the stub only answers for the
  // observer that watches the Article title.
  class ObserverStub {
    readonly #callback: IntersectionObserverCallback;
    #watchesTitle = false;

    constructor(callback: IntersectionObserverCallback) {
      this.#callback = callback;
    }

    observe(target: Element) {
      if (!target.matches('[data-slot="article-title"]')) {
        return;
      }

      this.#watchesTitle = true;
      report = (intersecting) => {
        act(() => {
          this.#callback(
            [{ isIntersecting: intersecting } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver
          );
        });
      };
    }

    // Next.js `Link` releases its own observers on unmount, so each instance
    // only ever withdraws the report it registered itself.
    unobserve(target: Element) {
      if (target.matches('[data-slot="article-title"]')) {
        this.disconnect();
      }
    }

    disconnect() {
      if (this.#watchesTitle) {
        this.#watchesTitle = false;
        report = null;
      }
    }
  }

  Object.assign(globalThis, { IntersectionObserver: ObserverStub });

  return {
    restore: () => {
      Object.assign(globalThis, { IntersectionObserver: original });
    },
    scrollTitleBehindChrome: () => report?.(false),
    scrollTitleIntoView: () => report?.(true),
  };
};

// Stop the `Link` short of navigating: an activated Link would take the test document with it.
const interceptActivation = (name: string) => {
  const activated = vi.fn();

  screen.getByRole("link", { name }).addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    activated();
  });

  return activated;
};

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

describe("Article header", () => {
  test("leaves the page main to the app shell", () => {
    render(
      <TooltipProvider>
        <ArticleView article={article()} />
      </TooltipProvider>
    );

    expect(screen.queryByRole("main")).toBeNull();
    expect(screen.getByRole("article")).toBeTruthy();
  });

  test("makes the complete Article title the page's only h1", () => {
    const longTitle =
      "Understanding cache components, and every reason a rendered page might disagree with the data behind it";

    render(
      <TooltipProvider>
        <ArticleView article={article({ title: longTitle })} />
      </TooltipProvider>
    );

    const headings = screen.getAllByRole("heading", { level: 1 });

    expect(headings).toHaveLength(1);
    expect(headings[0]?.textContent).toBe(longTitle);
  });

  test("states the publication date and the description", () => {
    const container = renderServer(article());

    expect(container.textContent).toContain("A representative Article.");
    expect(container.textContent).toContain("Published on 02.08.2026");
    expect(container.querySelector('time[datetime="2026-08-02"]')).toBeTruthy();
  });

  test("reports an update only when it is later than publication", () => {
    const updated = renderServer(
      article({ publishedAt: "2026-08-02", updatedAt: "2026-08-05" })
    );

    expect(updated.textContent).toContain("Updated 05.08.2026");

    document.body.replaceChildren();

    const republished = renderServer(
      article({ publishedAt: "2026-08-02", updatedAt: "2026-08-02" })
    );

    expect(republished.textContent).not.toContain("Updated");
  });

  test("says a Draft is unpublished instead of showing retained dates", () => {
    const container = renderServer(
      article({
        publishedAt: "2026-08-02",
        status: "draft",
        updatedAt: "2026-08-05",
      })
    );

    expect(container.textContent).toContain("Draft");
    expect(container.textContent).toContain("Not published");
    expect(container.textContent).not.toContain("02.08.2026");
    expect(container.textContent).not.toContain("05.08.2026");
  });

  test("renders Tags as inert labels and no Cover", () => {
    const container = renderServer(
      article({
        tags: [
          { id: "nextjs", label: "Next.js" },
          { id: "web-performance", label: "Web performance" },
        ],
      })
    );

    expect(container.textContent).toContain("Next.js");
    expect(container.textContent).toContain("Web performance");
    expect(
      within(container)
        .getAllByRole("link")
        .some((link) => link.textContent?.includes("Next.js"))
    ).toBeFalsy();
    expect(within(container).queryAllByRole("img")).toHaveLength(0);
  });
});

describe("Article reader navigation", () => {
  const neighbours: ArticleReaderNavigation = {
    next: { href: "/blog/older", title: "An older Article" },
    previous: { href: "/blog/newer", title: "A newer Article" },
  };

  test("server-renders a real Blog destination and both neighbours", () => {
    const container = renderServer(article({ navigation: neighbours }));
    const queries = within(container);

    expect(
      queries.getByRole("link", { name: "Back to Blog" }).getAttribute("href")
    ).toBe("/blog");
    expect(
      queries
        .getByRole("link", { name: "Previous Article" })
        .getAttribute("href")
    ).toBe("/blog/newer");
    expect(
      queries.getByRole("link", { name: "Next Article" }).getAttribute("href")
    ).toBe("/blog/older");
  });

  test("names both neighbours in full in the end pager", () => {
    const container = renderServer(article({ navigation: neighbours }));
    const pager = within(container).getByRole("navigation", {
      name: "Neighbouring Articles",
    });
    const links = within(pager).getAllByRole("link");

    expect(links.map((link) => link.getAttribute("href"))).toStrictEqual([
      "/blog/newer",
      "/blog/older",
    ]);
    expect(links[0]?.textContent).toContain("A newer Article");
    expect(links[1]?.textContent).toContain("An older Article");
  });

  test("keeps the opposite pager cell so direction survives a boundary", () => {
    const container = renderServer(
      article({ navigation: { next: neighbours.next, previous: null } })
    );
    const pager = within(container).getByRole("navigation", {
      name: "Neighbouring Articles",
    });

    expect(within(pager).getAllByRole("link")).toHaveLength(1);
    // The empty cell is what holds Next on the right at two columns.
    expect(pager.children).toHaveLength(2);
  });

  test("omits unavailable navigation rather than disabling it", () => {
    const container = renderServer(article());
    const queries = within(container);

    expect(
      queries.queryByRole("link", { name: "Previous Article" })
    ).toBeNull();
    expect(queries.queryByRole("link", { name: "Next Article" })).toBeNull();
    expect(
      queries.queryByRole("navigation", { name: "Neighbouring Articles" })
    ).toBeNull();
    expect(queries.getAllByRole("link")).toHaveLength(1);
  });

  test("activates either neighbour control with the Vim keys", async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <ArticleView article={article({ navigation: neighbours })} />
      </TooltipProvider>
    );

    const previous = interceptActivation("Previous Article");
    const next = interceptActivation("Next Article");

    await user.keyboard("h");

    expect(previous).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();

    await user.keyboard("l");

    expect(next).toHaveBeenCalledOnce();
    expect(previous).toHaveBeenCalledOnce();
  });

  test("holds the Vim keys at a collection boundary", async () => {
    const user = userEvent.setup();
    const activated = vi.fn();
    const intercept = () => {
      activated();
    };

    render(
      <TooltipProvider>
        <ArticleView article={article()} />
      </TooltipProvider>
    );
    document.addEventListener("click", intercept, true);

    try {
      await user.keyboard("hl");

      expect(activated).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener("click", intercept, true);
    }
  });

  test("leaves the Vim keys to a menu layered over the Article", async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <ArticleView article={article({ navigation: neighbours })} />
      </TooltipProvider>
    );

    const previous = interceptActivation("Previous Article");
    const next = interceptActivation("Next Article");

    // The Share menu, reduced to what makes it a layer: a portalled role that
    // is not a field, so the library's own input guard does not cover it.
    const menu = document.createElement("div");
    menu.setAttribute("role", "menu");
    document.body.append(menu);

    await user.keyboard("hl");

    expect(previous).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();

    menu.remove();

    await user.keyboard("l");

    expect(next).toHaveBeenCalledOnce();
  });

  test("names the key on the control it belongs to", async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <ArticleView article={article({ navigation: neighbours })} />
      </TooltipProvider>
    );

    await user.hover(screen.getByRole("link", { name: "Previous Article" }));

    const tip = await screen.findByRole("tooltip");

    expect(tip.textContent).toBe("Previous Article H");
  });

  test("leaves the Vim keys to a field that is being typed in", async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <input aria-label="Search Articles" />
        <ArticleView article={article({ navigation: neighbours })} />
      </TooltipProvider>
    );

    const previous = interceptActivation("Previous Article");
    const next = interceptActivation("Next Article");
    const field = screen.getByRole("textbox", { name: "Search Articles" });

    await user.click(field);
    await user.keyboard("hl");

    expect(field).toHaveProperty("value", "hl");
    expect(previous).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});

describe("Article sharing", () => {
  const CANONICAL_URL =
    "https://levin.baenninger.me/blog/representative-article";

  test("puts Share in front of the neighbour links", () => {
    const container = renderServer(
      article({
        navigation: {
          next: { href: "/blog/older", title: "An older Article" },
          previous: null,
        },
      }),
      CANONICAL_URL
    );

    // Document order is the contract here, and no accessible query expresses
    // one control coming before another.
    expect(
      [
        ...container.querySelectorAll(
          '[aria-label="Share"], [aria-label="Next Article"]'
        ),
      ].map((control) => control.getAttribute("aria-label"))
    ).toStrictEqual(["Share", "Next Article"]);
  });

  test("withholds complete-Article sharing from a local Draft", () => {
    const container = renderServer(
      article({ publishedAt: null, status: "draft" })
    );

    expect(
      within(container).queryByRole("button", { name: "Share" })
    ).toBeNull();
  });
});

describe("sticky Article title", () => {
  test("appears once the title passes beneath the sticky chrome", () => {
    const observer = stubIntersectionObserver();

    try {
      render(
        <TooltipProvider>
          <ArticleView article={article({ title: "Sticky title" })} />
        </TooltipProvider>
      );

      const copy = screen
        .getAllByText("Sticky title")
        .find((element) => element.tagName === "P");

      if (copy === undefined) {
        throw new Error("Expected the toolbar copy of the Article title.");
      }

      expect(copy.dataset.behindChrome).toBe("false");

      observer.scrollTitleBehindChrome();
      expect(copy.dataset.behindChrome).toBe("true");

      observer.scrollTitleIntoView();
      expect(copy.dataset.behindChrome).toBe("false");
    } finally {
      observer.restore();
    }
  });

  test("stays out of the accessibility tree at every scroll position", () => {
    const observer = stubIntersectionObserver();

    try {
      render(
        <TooltipProvider>
          <ArticleView article={article({ title: "Sticky title" })} />
        </TooltipProvider>
      );

      expect(
        screen.getAllByRole("heading", { name: "Sticky title" })
      ).toHaveLength(1);

      observer.scrollTitleBehindChrome();

      expect(
        screen.getAllByRole("heading", { name: "Sticky title" })
      ).toHaveLength(1);
      expect(screen.getAllByText("Sticky title")).toHaveLength(2);
    } finally {
      observer.restore();
    }
  });

  test("cross-fades only where motion is welcome", () => {
    const observer = stubIntersectionObserver();

    try {
      render(
        <TooltipProvider>
          <ArticleView article={article({ title: "Sticky title" })} />
        </TooltipProvider>
      );

      const copy = screen
        .getAllByText("Sticky title")
        .find((element) => element.tagName === "P");

      // Reduced motion is answered in CSS rather than in JavaScript, so the
      // observable contract is that the fade is conditional at all.
      expect(copy?.className).toContain("motion-reduce:transition-none");
    } finally {
      observer.restore();
    }
  });

  test("says nothing before hydration", () => {
    const container = renderServer(article({ title: "Sticky title" }));

    expect(container.querySelector('[data-behind-chrome="true"]')).toBeNull();
  });
});
