import { readFileSync } from "node:fs";

import { describe, expect, test } from "vite-plus/test";

import type { ArticleSearchDocument } from "@/modules/blog/search-artifact";

import { createArticleSearchResponse } from "./search-route";

const routeSource = readFileSync(
  new URL("../blog/search.json/route.ts", import.meta.url),
  "utf-8"
);

const document = (id: string): ArticleSearchDocument => ({
  id,
  href: `/blog/${id}`,
  title: `Article ${id}`,
  description: "Description.",
  tags: [{ id: "nextjs", label: "Next.js" }],
  headings: ["Heading"],
  body: "Visitor-readable body.",
  status: "published",
});

describe("Article search Route Handler response", () => {
  test("emits deterministic JSON bytes and exact public headers", async () => {
    const first = createArticleSearchResponse([
      document("zebra"),
      document("alpha"),
    ]);
    const second = createArticleSearchResponse([
      document("zebra"),
      document("alpha"),
    ]);

    expect(first.headers.get("Content-Type")).toBe(
      "application/json; charset=utf-8"
    );
    expect(first.headers.get("X-Robots-Tag")).toBe(
      "noindex, nofollow, nosnippet"
    );
    expect(await first.text()).toBe(
      `${JSON.stringify({
        schemaVersion: 1,
        documents: [document("alpha"), document("zebra")],
      })}\n`
    );
    expect(new Uint8Array(await second.arrayBuffer())).toEqual(
      new TextEncoder().encode(
        `${JSON.stringify({
          schemaVersion: 1,
          documents: [document("alpha"), document("zebra")],
        })}\n`
      )
    );
  });

  test("emits a valid empty envelope", async () => {
    await expect(createArticleSearchResponse([]).json()).resolves.toEqual({
      documents: [],
      schemaVersion: 1,
    });
  });

  test("keeps the request-independent Route Handler force-static", () => {
    expect(routeSource).toContain('export const dynamic = "force-static"');
    expect(routeSource).not.toContain("Request");
  });
});
