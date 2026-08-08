import { act, cleanup, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";

import type { ArticleDetail, ArticleReaderNavigation } from "./types";
import { ArticleView } from "./view";

const COVER = { height: 630, src: "/cover.png", width: 1200 };

const NO_NEIGHBOURS: ArticleReaderNavigation = { next: null, previous: null };

const article = ({
  navigation = NO_NEIGHBOURS,
  publishedAt = "2026-08-02",
  status = "published",
  tags = [],
  title = "Representative Article",
  updatedAt = null,
}: {
  readonly navigation?: ArticleReaderNavigation;
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

/** The prerender: `renderToStaticMarkup` runs no effects, so this is the
 *  reader a visitor receives before — or without — any JavaScript. */
const renderServer = (detail: ArticleDetail) => {
  const container = document.createElement("div");

  container.innerHTML = renderToStaticMarkup(<ArticleView article={detail} />);
  document.body.append(container);

  return container;
};

/**
 * A driveable `IntersectionObserver`. Happy DOM supplies one that never
 * reports, and the sticky title is precisely a report about a scroll position.
 */
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

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

describe("Article header", () => {
  test("leaves the page main to the app shell", () => {
    render(<ArticleView article={article()} />);

    expect(screen.queryByRole("main")).toBeNull();
    expect(screen.getByRole("article")).toBeTruthy();
  });

  test("makes the complete Article title the page's only h1", () => {
    const longTitle =
      "Understanding cache components, and every reason a rendered page might disagree with the data behind it";

    render(<ArticleView article={article({ title: longTitle })} />);

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
    ).toBe(false);
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

    expect(links.map((link) => link.getAttribute("href"))).toEqual([
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
});

describe("sticky Article title", () => {
  test("appears once the title passes beneath the sticky chrome", () => {
    const observer = stubIntersectionObserver();

    try {
      render(<ArticleView article={article({ title: "Sticky title" })} />);

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
      render(<ArticleView article={article({ title: "Sticky title" })} />);

      expect(
        screen.getAllByRole("heading", { name: "Sticky title" })
      ).toHaveLength(1);

      observer.scrollTitleBehindChrome();

      // The `h1` is still the only thing that says the title out loud; the
      // toolbar copy is a visual reminder and nothing else.
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
      render(<ArticleView article={article({ title: "Sticky title" })} />);

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
