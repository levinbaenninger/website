import { describe, expect, test } from "vite-plus/test";

import {
  ARTICLE_SEARCH_SCHEMA_VERSION,
  createArticleSearchArtifact,
  parseArticleSearchArtifact,
  serializeArticleSearchArtifact,
} from "./search-contract";
import type { ArticleSearchDocument } from "./types";

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
    const first = serializeArticleSearchArtifact([
      document("zebra"),
      document("alpha"),
    ]);
    const second = serializeArticleSearchArtifact([
      document("zebra"),
      document("alpha"),
    ]);

    expect(first).toBe(second);
    expect(first).toBe(
      `${JSON.stringify({
        schemaVersion: 1,
        documents: [document("alpha"), document("zebra")],
      })}\n`
    );
    expect(new TextEncoder().encode(first)).toEqual(
      new TextEncoder().encode(second)
    );
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
