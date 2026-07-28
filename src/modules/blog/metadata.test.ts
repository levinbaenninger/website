import { Temporal } from "@js-temporal/polyfill";
import { describe, expect, test } from "vite-plus/test";

import { validateArticleMetadata } from "./metadata";

const TODAY = Temporal.PlainDate.from("2026-07-28");

const VALID_DRAFT = {
  title: "Understanding Cache Components",
  description: "A practical explanation of static shells and dynamic content.",
  status: "Draft",
  tags: ["nextjs"],
} as const;

describe("Article metadata", () => {
  test("accepts a strictly authored Draft", () => {
    expect(
      validateArticleMetadata(VALID_DRAFT, {
        slug: "understanding-cache-components",
        today: TODAY,
      })
    ).toEqual({
      ...VALID_DRAFT,
      redirectFrom: [],
      tags: [{ id: "nextjs", label: "Next.js" }],
    });
  });

  test.each([
    [
      "unknown fields",
      { ...VALID_DRAFT, excerpt: "Not part of the Article contract." },
    ],
    ["leading whitespace", { ...VALID_DRAFT, title: ` ${VALID_DRAFT.title}` }],
    ["non-NFC text", { ...VALID_DRAFT, title: "Cafe\u0301" }],
    [
      "more than 100 grapheme clusters",
      { ...VALID_DRAFT, title: "a".repeat(101) },
    ],
    ["unknown Tags", { ...VALID_DRAFT, tags: ["unknown"] }],
    ["duplicate Tags", { ...VALID_DRAFT, tags: ["nextjs", "nextjs"] }],
    [
      "a Published Article without a publication date",
      { ...VALID_DRAFT, status: "Published" },
    ],
    [
      "an update before publication",
      {
        ...VALID_DRAFT,
        status: "Published",
        publishedAt: "2026-07-20",
        updatedAt: "2026-07-19",
      },
    ],
    [
      "a future publication date",
      {
        ...VALID_DRAFT,
        status: "Published",
        publishedAt: "2026-07-29",
      },
    ],
  ])("rejects %s without repairing it", (_case, metadata) => {
    expect(() =>
      validateArticleMetadata(metadata, {
        slug: "understanding-cache-components",
        today: TODAY,
      })
    ).toThrow();
  });

  test("rejects a malformed filename-derived slug", () => {
    expect(() =>
      validateArticleMetadata(VALID_DRAFT, {
        slug: "Understanding_Cache_Components",
        today: TODAY,
      })
    ).toThrow(/slug/u);
  });
});
