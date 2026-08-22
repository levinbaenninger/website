import { expect, test, vi } from "vite-plus/test";

import type { ArticleSearchDocument } from "@/features/blog/articles/types";

import { dynamic, GET } from "./route";

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

vi.mock(import("@/app/blog/_articles/server"), () => ({
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
  await expect(response.json()).resolves.toStrictEqual({
    schemaVersion: 1,
    documents,
  });
});
