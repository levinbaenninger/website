import { describe, expect, test, vi } from "vite-plus/test";

import type { ArticleSearchDocument } from "@/features/blog/articles/types";

import type { ArticleSearchArtifact } from "./contract";
import {
  ARTICLE_SEARCH_ARTIFACT_URL,
  createArticleSearchLoader,
} from "./service";

const document = (
  id: string,
  overrides: Partial<ArticleSearchDocument> = {}
): ArticleSearchDocument => ({
  body: "Rendering and caching make web applications fast.",
  description: "A practical guide to modern web development.",
  headings: ["Introduction", "Cache Components"],
  href: `/blog/${id}`,
  id,
  status: "published",
  tags: [{ id: "nextjs", label: "Next.js" }],
  title: `Article ${id}`,
  ...overrides,
});

const artifact = (
  documents: readonly ArticleSearchDocument[]
): ArticleSearchArtifact => ({
  documents,
  schemaVersion: 1,
});

const loadFuse = async () => await import("fuse.js");

const createResponse = (value: unknown): Response =>
  Response.json(value, { status: 200 });

describe("client-safe Article search", () => {
  test("normalizes queries and returns nothing for normalized empty input", async () => {
    const fetchArtifact = vi.fn(async () => {
      await Promise.resolve();
      return createResponse(
        artifact([
          document("cafe", {
            title: "Café architecture",
          }),
        ])
      );
    });
    const search = await createArticleSearchLoader({
      fetchArtifact,
      loadFuse,
    }).load();

    expect(search.search(" \n\t ")).toStrictEqual([]);
    expect(search.search("  Cafe\u0301   architecture ")).toHaveLength(1);
    expect(fetchArtifact).toHaveBeenCalledWith(ARTICLE_SEARCH_ARTIFACT_URL);
  });

  test("requires every token, tolerates typos, and uses slug ties", async () => {
    const search = await createArticleSearchLoader({
      fetchArtifact: async () => {
        await Promise.resolve();
        return createResponse(
          artifact([
            document("a-title", {
              body: "Unrelated prose.",
              headings: [],
              title: "Cache Components",
            }),
            document("body-only", {
              body: "Cache Components",
              headings: [],
              title: "Rendering guide",
            }),
            document("partial-token", {
              body: "Caching without the second query term.",
              headings: [],
              title: "Cache reference",
            }),
            document("z-title", {
              body: "Unrelated prose.",
              headings: [],
              title: "Cache Components",
            }),
          ])
        );
      },
      loadFuse,
    }).load();

    // Body-only is last but present: it says the words, so it is an answer.
    expect(search.search("cache components").map(({ id }) => id)).toStrictEqual(
      ["a-title", "z-title", "body-only"]
    );
    expect(search.search("cache component").map(({ id }) => id)).toContain(
      "a-title"
    );
  });

  test("ranks Tag labels, descriptions, headings, and body by fixed precedence", async () => {
    const search = await createArticleSearchLoader({
      fetchArtifact: async () => {
        await Promise.resolve();
        return createResponse(
          artifact([
            document("body", {
              body: "quasar",
              description: "Unrelated",
              headings: [],
              tags: [],
              title: "quasar",
            }),
            document("description", {
              body: "Unrelated",
              description: "quasar",
              headings: [],
              tags: [],
              title: "quasar",
            }),
            document("heading", {
              body: "Unrelated",
              description: "Unrelated",
              headings: ["quasar"],
              tags: [],
              title: "quasar",
            }),
            document("tag-label", {
              body: "Unrelated",
              description: "Unrelated",
              headings: [],
              tags: [{ id: "other", label: "quasar" }],
              title: "quasar",
            }),
          ])
        );
      },
      loadFuse,
    }).load();

    expect(search.search("quasar").map(({ id }) => id)).toStrictEqual([
      "tag-label",
      "description",
      "heading",
      "body",
    ]);
  });

  test("ignores canonical Tag IDs, which a visitor never sees", async () => {
    const search = await createArticleSearchLoader({
      fetchArtifact: async () => {
        await Promise.resolve();
        return createResponse(
          artifact([
            document("tag-id-only", {
              body: "Unrelated",
              description: "Unrelated",
              headings: [],
              tags: [{ id: "quasar", label: "Other" }],
              title: "Unrelated",
            }),
          ])
        );
      },
      loadFuse,
    }).load();

    expect(search.search("quasar")).toStrictEqual([]);
  });

  test("keeps a heading- or body-only match the title cannot explain", async () => {
    const search = await createArticleSearchLoader({
      fetchArtifact: async () => {
        await Promise.resolve();
        return createResponse(
          artifact([
            document("body-only", {
              body: "Every image budget dies in a spreadsheet.",
              description: "Unrelated.",
              headings: [],
              tags: [],
              title: "Unrelated prose",
            }),
            document("heading-only", {
              body: "Unrelated.",
              description: "Unrelated.",
              headings: ["Injecting a fetch"],
              tags: [],
              title: "Unrelated prose",
            }),
          ])
        );
      },
      loadFuse,
    }).load();

    expect(search.search("spreadsheet").map(({ id }) => id)).toStrictEqual([
      "body-only",
    ]);
    expect(
      search.search("injecting a fetch").map(({ id }) => id)
    ).toStrictEqual(["heading-only"]);
  });

  test("separates the candidate gate from the relevance gate", async () => {
    const search = await createArticleSearchLoader({
      fetchArtifact: async () => {
        await Promise.resolve();
        return createResponse(
          artifact([
            document("exact", {
              body: "Caching is the topic here.",
              description: "Unrelated.",
              headings: [],
              tags: [],
              title: "Unrelated prose",
            }),
            // Close enough to reach the candidate gate on `coaching`, far
            // enough that offering it as an answer would be a guess.
            document("near", {
              body: "A coaching manual for unrelated prose.",
              description: "Unrelated.",
              headings: [],
              tags: [],
              title: "Unrelated prose",
            }),
          ])
        );
      },
      loadFuse,
    }).load();

    expect(search.search("caching").map(({ id }) => id)).toStrictEqual([
      "exact",
    ]);
    expect(search.search("rust")).toStrictEqual([]);
  });

  test("returns plain strings with valid end-exclusive ranges and deterministic snippets", async () => {
    const search = await createArticleSearchLoader({
      fetchArtifact: async () => {
        await Promise.resolve();
        return createResponse(
          artifact([
            document("highlighted", {
              body: `${"Context ".repeat(30)}cache boundary${" tail".repeat(30)}`,
              description: "Description without the query.",
              headings: ["Cache Components"],
              tags: [{ id: "cache", label: "Cache systems" }],
              title: "Cache architecture",
            }),
          ])
        );
      },
      loadFuse,
    }).load();

    const [result] = search.search("cache");

    if (result === undefined) {
      throw new TypeError("Expected the matching Article search result.");
    }
    expect(result.title.text).toBe("Cache architecture");
    expect(result.title.highlights).toStrictEqual([{ end: 5, start: 0 }]);
    expect(result.tags[0]).toStrictEqual({
      id: "cache",
      label: {
        highlights: [{ end: 5, start: 0 }],
        text: "Cache systems",
      },
    });
    expect(result.snippet).toMatchObject({
      highlights: [{ end: 5, start: 0 }],
      leadingEllipsis: false,
      source: "heading",
      text: "Cache Components",
      trailingEllipsis: false,
    });

    for (const highlighted of [
      result.title,
      ...result.tags.map(({ label }) => label),
      result.snippet,
    ]) {
      if (highlighted === null || highlighted === undefined) {
        continue;
      }
      for (const range of highlighted.highlights) {
        expect(range.start).toBeGreaterThanOrEqual(0);
        expect(range.end).toBeGreaterThan(range.start);
        expect(range.end).toBeLessThanOrEqual(highlighted.text.length);
      }
    }
  });

  test("crops body snippets at grapheme boundaries and remaps their ranges", async () => {
    const search = await createArticleSearchLoader({
      fetchArtifact: async () => {
        await Promise.resolve();
        return createResponse(
          artifact([
            document("body-snippet", {
              body: `${"🙂 context ".repeat(30)}cache boundary${" tail".repeat(30)}`,
              description: "Unrelated description.",
              headings: [],
              title: "Cache",
            }),
          ])
        );
      },
      loadFuse,
    }).load();
    const [result] = search.search("cache");

    expect(result?.snippet).toMatchObject({
      leadingEllipsis: true,
      source: "body",
      trailingEllipsis: true,
    });
    expect(result?.snippet?.text).not.toContain("\uFFFD");
    expect(result?.snippet?.highlights).toHaveLength(1);
    const [highlight] = result?.snippet?.highlights ?? [];
    expect(result?.snippet?.text.slice(highlight?.start, highlight?.end)).toBe(
      "cache"
    );
  });

  test("shares concurrent and successful loads as one page-lifetime instance", async () => {
    const pendingResponse = Promise.withResolvers<Response>();
    const fetchArtifact = vi.fn(async () => await pendingResponse.promise);
    const loader = createArticleSearchLoader({ fetchArtifact, loadFuse });
    const first = loader.load();
    const second = loader.load();

    pendingResponse.resolve(createResponse(artifact([document("shared")])));
    const [firstSearch, secondSearch] = await Promise.all([first, second]);

    expect(firstSearch).toBe(secondSearch);
    await expect(loader.load()).resolves.toBe(firstSearch);
    expect(fetchArtifact).toHaveBeenCalledOnce();
  });

  test("does not retain failed fetch, parse, version, validation, or construction attempts", async () => {
    const failures: readonly Response[] = [
      new Response("unavailable", { status: 503 }),
      new Response("{", { status: 200 }),
      createResponse({ documents: [], schemaVersion: 2 }),
      createResponse(
        artifact([
          {
            ...document("invalid"),
            href: "/blog/not-invalid",
          },
        ])
      ),
    ];

    const assertRetry = async (failedResponse: Response): Promise<void> => {
      const fetchArtifact = vi
        .fn<() => Promise<Response>>()
        .mockResolvedValueOnce(failedResponse)
        .mockResolvedValueOnce(
          createResponse(artifact([document("recovered")]))
        );
      const loader = createArticleSearchLoader({ fetchArtifact, loadFuse });

      await expect(loader.load()).rejects.toThrow(Error);
      const recovered = await loader.load();
      expect(recovered.search("recovered").map(({ id }) => id)).toStrictEqual([
        "recovered",
      ]);
      expect(fetchArtifact).toHaveBeenCalledTimes(2);
    };

    await Promise.all(failures.map(assertRetry));

    const constructorFailure = createArticleSearchLoader({
      fetchArtifact: async () => {
        await Promise.resolve();
        return createResponse(artifact([document("recovered")]));
      },
      loadFuse: vi
        .fn<typeof loadFuse>()
        .mockRejectedValueOnce(new Error("construction import failed"))
        .mockImplementation(loadFuse),
    });
    await expect(constructorFailure.load()).rejects.toThrow(
      "construction import failed"
    );
    const recoveredAfterImportFailure = await constructorFailure.load();
    expect(
      recoveredAfterImportFailure.search("recovered").map(({ id }) => id)
    ).toStrictEqual(["recovered"]);

    const constructError = new Error("index construction failed");
    const loadBrokenFuse = async () => {
      const fuseModule = await import("fuse.js");
      return {
        ...fuseModule,
        default: new Proxy(fuseModule.default, {
          construct() {
            throw constructError;
          },
        }),
      };
    };
    const constructionFailure = createArticleSearchLoader({
      fetchArtifact: async () => {
        await Promise.resolve();
        return createResponse(artifact([document("recovered")]));
      },
      loadFuse: vi
        .fn<typeof loadFuse>()
        .mockImplementationOnce(loadBrokenFuse)
        .mockImplementation(loadFuse),
    });
    await expect(constructionFailure.load()).rejects.toThrow(constructError);
    const recoveredAfterConstructionFailure = await constructionFailure.load();
    expect(
      recoveredAfterConstructionFailure.search("recovered").map(({ id }) => id)
    ).toStrictEqual(["recovered"]);
  });
});
