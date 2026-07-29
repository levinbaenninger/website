import { expect, test, vi } from "vite-plus/test";

import { dynamic, GET } from "@/app/blog/search.json/route";
import type { ArticleSearchDocument } from "@/modules/blog/search/artifact";

const { listArticleSearchDocuments } = vi.hoisted(() => ({
  listArticleSearchDocuments:
    vi.fn<() => Promise<readonly ArticleSearchDocument[]>>(),
}));

const documents: readonly ArticleSearchDocument[] = [
  {
    id: "controlled-article",
    href: "/blog/controlled-article",
    title: "Controlled Article",
    description: "Controlled description.",
    tags: [{ id: "nextjs", label: "Next.js" }],
    headings: ["Controlled heading"],
    body: "Controlled body.",
    status: "published",
  },
];

vi.mock(import("@/app/_blog/articles/server"), () => ({
  listArticleSearchDocuments,
}));

test("directly serves controlled Blog documents from a force-static handler", async () => {
  listArticleSearchDocuments.mockResolvedValue(documents);
  const response = await GET();

  expect(dynamic).toBe("force-static");
  expect(listArticleSearchDocuments).toHaveBeenCalledOnce();
  expect(response.headers.get("Content-Type")).toBe(
    "application/json; charset=utf-8"
  );
  expect(response.headers.get("X-Robots-Tag")).toBe(
    "noindex, nofollow, nosnippet"
  );
  await expect(response.json()).resolves.toEqual({
    schemaVersion: 1,
    documents,
  });
});
