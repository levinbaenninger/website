import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as wait } from "node:timers/promises";

import sharp from "sharp";
import { afterEach, describe, expect, test } from "vite-plus/test";

import {
  BlogValidationError,
  renderBlogDiagnostics,
  sortBlogDiagnostics,
} from "./diagnostics.mts";
import {
  checkArticleManifest,
  generateArticleManifest,
  watchArticleSource,
} from "./source-manifest.mts";
import type { BlogToolPaths } from "./source-manifest.mts";

const temporaryRepositories: string[] = [];

const createRepository = async (): Promise<BlogToolPaths> => {
  const repositoryRoot = await mkdtemp(path.join(tmpdir(), "blog-tooling-"));
  temporaryRepositories.push(repositoryRoot);
  const articlesRoot = path.join(repositoryRoot, "src/modules/blog/content");
  await mkdir(articlesRoot, { recursive: true });
  return {
    repositoryRoot,
    articlesRoot,
    manifestPath: path.join(
      repositoryRoot,
      "src/modules/blog/articles/manifest.generated.ts"
    ),
  };
};

const png = async (width = 2, height = 2): Promise<Buffer> =>
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: "#204080",
    },
  })
    .png()
    .toBuffer();

const createArticle = async (
  paths: BlogToolPaths,
  slug: string,
  options: {
    readonly mdx?: string;
    readonly cover?: Uint8Array;
    readonly coverName?: string;
    readonly assets?: Readonly<Record<string, Uint8Array>>;
  } = {}
): Promise<string> => {
  const bundle = path.join(paths.articlesRoot, slug);
  const assets = path.join(bundle, "assets");
  await mkdir(assets, { recursive: true });
  await writeFile(
    path.join(bundle, `${slug}.mdx`),
    options.mdx ??
      `export const frontmatter = {
  status: "Draft",
  title: "Fixture",
  description: "Fixture Article.",
  tags: ["react"],
};

## Fixture
`
  );
  await writeFile(
    path.join(assets, options.coverName ?? "cover.png"),
    options.cover ?? (await png())
  );
  for (const [relativePath, bytes] of Object.entries(options.assets ?? {})) {
    const absolutePath = path.join(assets, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, bytes);
  }
  return bundle;
};

afterEach(async () => {
  await Promise.all(
    temporaryRepositories.splice(0).map(async (repository) => {
      await rm(repository, { recursive: true, force: true });
    })
  );
});

describe("Article source-manifest tooling", () => {
  test("generates byte-stable lexical entries for repository-shaped bundles", async () => {
    const paths = await createRepository();
    await createArticle(paths, "zebra");
    await createArticle(paths, "alpha");
    const previousFetch = globalThis.fetch;
    globalThis.fetch = () => {
      throw new Error("Article artifact generation attempted network access.");
    };

    try {
      const first = await generateArticleManifest(paths);
      const firstBytes = await readFile(paths.manifestPath, "utf-8");
      const second = await generateArticleManifest(paths);
      const secondBytes = await readFile(paths.manifestPath, "utf-8");

      expect(first.changed).toBe(true);
      expect(second.changed).toBe(false);
      expect(secondBytes).toBe(firstBytes);
      expect(new TextEncoder().encode(secondBytes)).toEqual(
        new TextEncoder().encode(firstBytes)
      );
      expect(first.bundles.map(({ slug }) => slug)).toEqual(["alpha", "zebra"]);
      expect(firstBytes.indexOf('"alpha"')).toBeLessThan(
        firstBytes.indexOf('"zebra"')
      );
      expect(firstBytes)
        .toBe(`// Generated deterministically. Do not edit by hand.

import cover_alpha from "../content/alpha/assets/cover.png";
import cover_zebra from "../content/zebra/assets/cover.png";
import type { ArticleManifestEntry } from "./collection";

export const ARTICLE_MANIFEST = [
  {
    slug: "alpha",
    loadArticle: () =>
      import(
        "../content/alpha/alpha.mdx"
      ),
    cover: cover_alpha,
  },
  {
    slug: "zebra",
    loadArticle: () =>
      import(
        "../content/zebra/zebra.mdx"
      ),
    cover: cover_zebra,
  },
] as const satisfies readonly ArticleManifestEntry[];
`);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });

  test("supports a literally empty Article corpus", async () => {
    const paths = await createRepository();

    await expect(generateArticleManifest(paths)).resolves.toMatchObject({
      bundles: [],
      changed: true,
    });
    await expect(checkArticleManifest(paths)).resolves.toMatchObject({
      bundles: [],
      changed: false,
    });
  });

  test("watches structural changes and regenerates without a restart", async () => {
    const paths = await createRepository();
    await createArticle(paths, "initial");
    await generateArticleManifest(paths);
    const controller = new AbortController();
    const watching = watchArticleSource(paths, {
      signal: controller.signal,
      intervalMilliseconds: 10,
    });
    await wait(20);

    await createArticle(paths, "added");
    let manifest = "";
    for (let attempts = 0; attempts < 100; attempts += 1) {
      await wait(10);
      manifest = await readFile(paths.manifestPath, "utf-8");
      if (manifest.includes('"added"')) {
        break;
      }
    }
    controller.abort();
    await watching;

    expect(manifest).toContain('"added"');
  });

  test("reports drift without changing the tracked manifest", async () => {
    const paths = await createRepository();
    await createArticle(paths, "current");
    await mkdir(path.dirname(paths.manifestPath), { recursive: true });
    await writeFile(paths.manifestPath, "prior valid manifest\n");

    await expect(checkArticleManifest(paths)).rejects.toMatchObject({
      diagnostics: [{ ruleId: "blog/manifest-drift" }],
    });
    await expect(readFile(paths.manifestPath, "utf-8")).resolves.toBe(
      "prior valid manifest\n"
    );
  });

  test("validates every bundle before preserving the prior manifest on failure", async () => {
    const paths = await createRepository();
    await createArticle(paths, "valid");
    await generateArticleManifest(paths);
    const priorManifest = await readFile(paths.manifestPath, "utf-8");
    const invalidBundle = path.join(paths.articlesRoot, "invalid");
    await mkdir(invalidBundle);
    await writeFile(path.join(invalidBundle, "unexpected.txt"), "no");

    await expect(generateArticleManifest(paths)).rejects.toBeInstanceOf(
      BlogValidationError
    );
    await expect(readFile(paths.manifestPath, "utf-8")).resolves.toBe(
      priorManifest
    );

    await rm(invalidBundle, { recursive: true });
    await createArticle(paths, "recovered");
    await expect(generateArticleManifest(paths)).resolves.toMatchObject({
      changed: true,
    });
  });

  test("aggregates and deterministically sorts closed-shape failures", async () => {
    const paths = await createRepository();
    const bundle = path.join(paths.articlesRoot, "Bad Name");
    await mkdir(bundle);
    await writeFile(path.join(bundle, "extra.txt"), "no");

    const failure = await generateArticleManifest(paths).catch(
      (error: unknown) => error
    );

    expect(failure).toBeInstanceOf(BlogValidationError);
    const diagnostics = (failure as BlogValidationError).diagnostics;
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          explanation: expect.any(String),
          guidance: expect.any(String),
          ruleId: expect.stringMatching(/^blog\//u),
          source: expect.any(String),
        }),
      ])
    );
    expect(diagnostics.map(({ ruleId }) => ruleId)).toEqual(
      expect.arrayContaining([
        "blog/bundle-assets",
        "blog/bundle-mdx",
        "blog/bundle-shape",
        "blog/bundle-slug",
      ])
    );
    expect(diagnostics).toEqual(sortBlogDiagnostics(diagnostics));
  });

  test("rejects traversal, absolute, cross-Article, and suffixed asset paths", async () => {
    const paths = await createRepository();
    await createArticle(paths, "paths", {
      mdx: `import Traversal
  from "../other/assets/image.png"
import Absolute from "/tmp/image.png"
import CrossArticle from "./other/image.png"
import Suffixed from "./assets/image.png?raw"

export const frontmatter = {};
`,
      assets: { "image.png": await png() },
    });

    const failure = await generateArticleManifest(paths).catch(
      (error: unknown) => error
    );

    expect(failure).toBeInstanceOf(BlogValidationError);
    expect(
      (failure as BlogValidationError).diagnostics.map(({ ruleId }) => ruleId)
    ).toEqual(
      expect.arrayContaining([
        "blog/import-absolute",
        "blog/import-cross-article",
        "blog/import-suffix",
        "blog/import-traversal",
      ])
    );
  });

  test("rejects orphaned and duplicate non-Cover asset imports", async () => {
    const paths = await createRepository();
    await createArticle(paths, "media-ownership", {
      mdx: `import Diagram from "./assets/diagram.png"
import Duplicate from "./assets/diagram.png"

## Media
`,
      assets: {
        "diagram.png": await png(),
        "orphan.png": await png(),
      },
    });

    await expect(generateArticleManifest(paths)).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ ruleId: "blog/asset-orphan" }),
        expect.objectContaining({ ruleId: "blog/import-duplicate" }),
      ]),
    });
  });

  test("generates collision-free identifiers for every valid slug", async () => {
    const paths = await createRepository();
    await createArticle(paths, "a-1");
    await createArticle(paths, "a1");

    const { manifest } = await generateArticleManifest(paths);

    expect(manifest).toContain("import cover_a_1 ");
    expect(manifest).toContain("import cover_a1 ");
  });

  test("rejects hidden, unsupported, mixed-case, and multi-suffix assets", async () => {
    const paths = await createRepository();
    await createArticle(paths, "names", {
      assets: {
        ".hidden.png": await png(),
        "diagram.final.png": await png(),
        "photo.PNG": await png(),
        "video.gif": Uint8Array.from([71, 73, 70]),
      },
    });

    const failure = await generateArticleManifest(paths).catch(
      (error: unknown) => error
    );
    const ruleIds = (failure as BlogValidationError).diagnostics.map(
      ({ ruleId }) => ruleId
    );

    expect(ruleIds).toEqual(
      expect.arrayContaining([
        "blog/path-extension",
        "blog/path-hidden",
        "blog/path-multiple-suffixes",
        "blog/path-name",
      ])
    );
  });

  test("enforces one exactly named Cover and Article-local path ceilings", async () => {
    const paths = await createRepository();
    await createArticle(paths, "cover-name");
    await writeFile(
      path.join(paths.articlesRoot, "cover-name/assets/cover.jpg"),
      await sharp(await png())
        .jpeg()
        .toBuffer()
    );
    await createArticle(paths, "wrong-case", { coverName: "Cover.png" });

    const longPath = ["a".repeat(80), "b".repeat(80), "c".repeat(80)].join("/");
    await createArticle(paths, "long-path", {
      mdx: `import Diagram from "./assets/${longPath}/diagram.png"

export const frontmatter = {};
`,
      assets: { [`${longPath}/diagram.png`]: await png() },
    });

    await expect(generateArticleManifest(paths)).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ ruleId: "blog/cover-count" }),
        expect.objectContaining({ ruleId: "blog/path-length" }),
        expect.objectContaining({ ruleId: "blog/path-name" }),
      ]),
    });
  });

  test("rejects symlinks without following them", async () => {
    const paths = await createRepository();
    const bundle = await createArticle(paths, "linked");
    await symlink(
      path.join(bundle, "assets/cover.png"),
      path.join(bundle, "assets/linked.png")
    );

    await expect(generateArticleManifest(paths)).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ ruleId: "blog/path-symlink" }),
      ]),
    });

    const requiredPaths = await createRepository();
    const requiredBundle = await createArticle(requiredPaths, "required");
    await rm(path.join(requiredBundle, "required.mdx"));
    await symlink(
      path.join(requiredBundle, "assets/cover.png"),
      path.join(requiredBundle, "required.mdx")
    );
    await expect(generateArticleManifest(requiredPaths)).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ ruleId: "blog/path-symlink" }),
      ]),
    });
  });

  test("validates raster signatures and complete decoding", async () => {
    const paths = await createRepository();
    await createArticle(paths, "corrupt", {
      cover: Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    });

    await expect(generateArticleManifest(paths)).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ ruleId: "blog/media-raster-decode" }),
      ]),
    });
  });

  test("accepts every supported still-raster Cover format", async () => {
    const paths = await createRepository();
    const source = await png();
    const jpeg = await sharp(source).jpeg().toBuffer();
    await createArticle(paths, "jpg-cover", {
      cover: jpeg,
      coverName: "cover.jpg",
    });
    await createArticle(paths, "jpeg-cover", {
      cover: jpeg,
      coverName: "cover.jpeg",
    });
    await createArticle(paths, "webp-cover", {
      cover: await sharp(source).webp().toBuffer(),
      coverName: "cover.webp",
    });
    await createArticle(paths, "avif-cover", {
      cover: await sharp(source).avif().toBuffer(),
      coverName: "cover.avif",
    });

    await expect(generateArticleManifest(paths)).resolves.toMatchObject({
      bundles: expect.arrayContaining([
        expect.objectContaining({ slug: "avif-cover" }),
        expect.objectContaining({ slug: "jpeg-cover" }),
        expect.objectContaining({ slug: "jpg-cover" }),
        expect.objectContaining({ slug: "webp-cover" }),
      ]),
    });
  });

  test("enforces raster byte and dimension ceilings", async () => {
    const oversizedPaths = await createRepository();
    const oversized = Buffer.alloc(10 * 1024 * 1024 + 1);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(
      oversized
    );
    await createArticle(oversizedPaths, "oversized", { cover: oversized });
    await expect(generateArticleManifest(oversizedPaths)).rejects.toMatchObject(
      {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({ ruleId: "blog/media-raster-byte-limit" }),
        ]),
      }
    );

    const dimensionsPaths = await createRepository();
    await createArticle(dimensionsPaths, "dimensions", {
      cover: await png(8193, 1),
    });
    await expect(
      generateArticleManifest(dimensionsPaths)
    ).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ ruleId: "blog/media-raster-dimensions" }),
      ]),
    });
  });

  test("rejects animated PNG Covers", async () => {
    const paths = await createRepository();
    const still = await png();
    const animationChunk = Buffer.alloc(20);
    animationChunk.writeUInt32BE(8, 0);
    animationChunk.write("acTL", 4, "ascii");
    animationChunk.writeUInt32BE(1, 8);
    const animated = Buffer.concat([
      still.subarray(0, 8),
      animationChunk,
      still.subarray(8),
    ]);
    await createArticle(paths, "animated", { cover: animated });

    await expect(generateArticleManifest(paths)).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ ruleId: "blog/media-animation" }),
      ]),
    });
  });

  test("accepts safe SVG and rejects active or unresolved SVG capabilities", async () => {
    const paths = await createRepository();
    const safeSvg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><defs><linearGradient id="paint"><stop offset="0" stop-color="#fff"/></linearGradient></defs><rect width="10" height="10" fill="url(#paint)"/></svg>'
    );
    await createArticle(paths, "safe-svg", {
      cover: safeSvg,
      coverName: "cover.svg",
    });
    await expect(generateArticleManifest(paths)).resolves.toMatchObject({
      changed: true,
    });

    const unsafePaths = await createRepository();
    await createArticle(unsafePaths, "unsafe-svg", {
      cover: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><script>alert(1)</script><rect fill="url(#missing)"/></svg>'
      ),
      coverName: "cover.svg",
    });

    await expect(generateArticleManifest(unsafePaths)).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ ruleId: "blog/media-svg-element" }),
        expect.objectContaining({
          ruleId: "blog/media-svg-unresolved-reference",
        }),
      ]),
    });
  });

  test("treats every XML parser warning as malformed SVG", async () => {
    const paths = await createRepository();
    await createArticle(paths, "repaired-svg", {
      cover: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width=10 height="10" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>'
      ),
      coverName: "cover.svg",
    });

    await expect(generateArticleManifest(paths)).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ ruleId: "blog/media-svg-xml" }),
      ]),
    });
  });

  test("rejects malformed, active, styled, external, and ambiguous SVG input", async () => {
    const paths = await createRepository();
    await createArticle(paths, "svg-policy", {
      cover: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><style>rect{fill:red}</style><a href="https://example.com"><rect id="same" onload="run()" font-family="remote"/></a><circle id="same" fill="url(https://example.com/paint)"/></svg>'
      ),
      coverName: "cover.svg",
    });

    const failure = await generateArticleManifest(paths).catch(
      (error: unknown) => error
    );
    expect(failure).toBeInstanceOf(BlogValidationError);
    const ruleIds = (failure as BlogValidationError).diagnostics.map(
      ({ ruleId }) => ruleId
    );
    expect(ruleIds).toEqual(
      expect.arrayContaining([
        "blog/media-svg-attribute",
        "blog/media-svg-duplicate-id",
        "blog/media-svg-element",
        "blog/media-svg-external-resource",
        "blog/media-svg-reference",
      ])
    );

    const malformedPaths = await createRepository();
    await createArticle(malformedPaths, "malformed-svg", {
      cover: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><rect></svg>'
      ),
      coverName: "cover.svg",
    });
    await expect(generateArticleManifest(malformedPaths)).rejects.toMatchObject(
      {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({ ruleId: "blog/media-svg-xml" }),
        ]),
      }
    );

    const entityPaths = await createRepository();
    await createArticle(entityPaths, "entity-svg", {
      cover: Buffer.from(
        '<!DOCTYPE svg [<!ENTITY x "unsafe">]><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><text>&x;</text></svg>'
      ),
      coverName: "cover.svg",
    });
    await expect(generateArticleManifest(entityPaths)).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ ruleId: "blog/media-svg-entity" }),
      ]),
    });

    const oversizedPaths = await createRepository();
    await createArticle(oversizedPaths, "oversized-svg", {
      cover: Buffer.alloc(1024 * 1024 + 1, 32),
      coverName: "cover.svg",
    });
    await expect(generateArticleManifest(oversizedPaths)).rejects.toMatchObject(
      {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({ ruleId: "blog/media-svg-byte-limit" }),
        ]),
      }
    );
  });

  test("renders stable actionable diagnostics with safely represented values", () => {
    const rendered = renderBlogDiagnostics([
      {
        source: "z.mdx",
        ruleId: "blog/z",
        explanation: "Z failed.",
        guidance: "Fix Z.",
        value: "\u001B[31mvalue",
      },
      {
        source: "a.mdx",
        line: 2,
        column: 3,
        ruleId: "blog/a",
        articleSlug: "article",
        explanation: "A failed.",
        guidance: "Fix A.",
      },
      {
        source: "bad\u001B[31m\u009B.mdx",
        ruleId: "blog/control",
        explanation: "A path failed.",
        guidance: "Rename it.",
      },
    ]);

    expect(rendered).toContain('a.mdx:2:3 [blog/a] [Article "article"]');
    expect(rendered).toContain('"\\u001b[31mvalue"');
    expect(rendered).toContain("bad\\u001b[31m\\u009b.mdx");
    expect(rendered).not.toContain("bad\u001B[31m\u009B.mdx");
    expect(rendered.indexOf("a.mdx")).toBeLessThan(rendered.indexOf("z.mdx"));
    expect(rendered).toContain("Fix: Fix A.");
  });
});
