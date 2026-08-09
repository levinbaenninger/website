import { describe, expect, test, vi } from "vite-plus/test";

import { requireCurrentArticle } from "@/app/blog/[slug]/article-navigation";

describe("Article navigation adapter", () => {
  test("maps former slugs to an exact permanent redirect and absence to not-found", () => {
    const permanentRedirect = vi.fn((): never => {
      throw new Error("redirected");
    });
    const notFound = vi.fn((): never => {
      throw new Error("not found");
    });

    expect(() =>
      requireCurrentArticle(
        {
          destination: "/blog/current-article",
          kind: "redirect",
        },
        { notFound, permanentRedirect }
      )
    ).toThrow("redirected");
    expect(permanentRedirect).toHaveBeenCalledWith(
      "/blog/current-article",
      "replace"
    );

    expect(() =>
      requireCurrentArticle(
        { kind: "not-found" },
        { notFound, permanentRedirect }
      )
    ).toThrow("not found");
    expect(notFound).toHaveBeenCalledOnce();
  });
});
