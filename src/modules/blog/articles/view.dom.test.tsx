import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vite-plus/test";

import type { ArticleDetail } from "./types";
import { ArticleView } from "./view";

const article = {
  Content: () => <p>Article body</p>,
  cover: {
    height: 630,
    src: "/cover.png",
    width: 1200,
  },
  description: "A representative Article.",
  discovery: {
    cover: {
      height: 630,
      src: "/cover.png",
      width: 1200,
    },
    description: "A representative Article.",
    href: "/blog/representative-article",
    publishedAt: "2026-08-02",
    tags: [],
    title: "Representative Article",
    updatedAt: null,
  },
  href: "/blog/representative-article",
  publishedAt: "2026-08-02",
  slug: "representative-article",
  status: "published",
  tags: [],
  title: "Representative Article",
  updatedAt: null,
} satisfies ArticleDetail;

describe("Article view landmarks", () => {
  afterEach(() => {
    cleanup();
  });

  test("leaves the page main to the app shell", () => {
    render(<ArticleView article={article} />);

    expect(screen.queryByRole("main")).toBeNull();
    expect(screen.getByRole("article")).toBeTruthy();
  });
});
