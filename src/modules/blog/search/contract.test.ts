import { afterEach, describe, expect, test, vi } from "vite-plus/test";

import type { ArticleSearchDocument } from "@/modules/blog/articles/types";

import {
  ARTICLE_SEARCH_SCHEMA_VERSION,
  createArticleSearchArtifact,
  parseArticleSearchArtifact,
  serializeArticleSearchArtifact,
} from "./contract";

afterEach(() => {
  vi.restoreAllMocks();
});

const document = (
  id: string,
  overrides: Partial<ArticleSearchDocument> = {}
): ArticleSearchDocument => ({
  id,
  href: `/blog/${id}`,
  title: `Article ${id}`,
  description: "A useful description.",
  tags: [{ id: "nextjs", label: "Next.js" }],
  headings: ["Introduction"],
  body: "Normalized visitor-readable body.",
  status: "published",
  ...overrides,
});

describe("Article search artifact contract", () => {
  test("creates a versioned, slug-sorted, engine-neutral envelope", () => {
    expect(
      createArticleSearchArtifact([document("zebra"), document("alpha")])
    ).toEqual({
      documents: [document("alpha"), document("zebra")],
      schemaVersion: ARTICLE_SEARCH_SCHEMA_VERSION,
    });
  });

  test("serializes deterministic UTF-8 JSON with a trailing newline", () => {
    const alpha = document("alpha", { title: "Café ☕" });
    vi.spyOn(Date, "now").mockImplementation(() => {
      throw new Error("Search artifact serialization read the clock.");
    });
    vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("Search artifact serialization used randomness.");
    });
    const first = serializeArticleSearchArtifact([document("zebra"), alpha]);
    const second = serializeArticleSearchArtifact([document("zebra"), alpha]);

    expect(first).toBe(second);
    expect(first).toBe(
      `${JSON.stringify({
        schemaVersion: 1,
        documents: [alpha, document("zebra")],
      })}\n`
    );
    const bytes = new TextEncoder().encode(first);
    expect(bytes).toEqual(new TextEncoder().encode(second));
    expect([...bytes]).toEqual(
      expect.arrayContaining([0xc3, 0xa9, 0xe2, 0x98, 0x95])
    );
    expect(first).not.toContain("\r");
  });

  test("rejects malformed, mismatched, duplicated, and unsupported envelopes", () => {
    expect(() =>
      parseArticleSearchArtifact({
        documents: [document("article")],
        schemaVersion: 2,
      })
    ).toThrow(/schema version/u);
    expect(() =>
      parseArticleSearchArtifact({
        documents: [
          {
            ...document("article"),
            href: "/blog/different",
          },
        ],
        schemaVersion: 1,
      })
    ).toThrow(/href/u);
    expect(() =>
      parseArticleSearchArtifact({
        documents: [document("article"), document("article")],
        schemaVersion: 1,
      })
    ).toThrow(/unique/u);
    expect(() =>
      parseArticleSearchArtifact({
        documents: [document("zebra"), document("alpha")],
        schemaVersion: 1,
      })
    ).toThrow(/slug order/u);
    expect(() =>
      parseArticleSearchArtifact({
        documents: [{ ...document("article"), engine: "Fuse.js" }],
        schemaVersion: 1,
      })
    ).toThrow(/invalid/u);
    expect(() =>
      parseArticleSearchArtifact({
        documents: [
          document("article", {
            body: "Cafe\u0301\nbody",
          }),
        ],
        schemaVersion: 1,
      })
    ).toThrow(/NFC|whitespace/u);
  });
});
