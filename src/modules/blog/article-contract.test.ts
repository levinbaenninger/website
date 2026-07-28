import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vite-plus/test";

const require = createRequire(import.meta.url);
const nextMdxEntry = require.resolve("@next/mdx");
const loadedNextMdxLoader: unknown = require(
  path.join(path.dirname(nextMdxEntry), "mdx-js-loader.js")
);
const articleContractPlugin = fileURLToPath(
  new URL("article-contract.mts", import.meta.url)
);

interface MdxLoaderContext {
  readonly _compiler: object;
  readonly context: string;
  readonly mode: "production";
  readonly resourcePath: string;
  readonly sourceMap: false;
  readonly getOptions: () => {
    readonly remarkPlugins: readonly string[];
  };
  readonly async: () => (error?: Error, result?: Uint8Array) => void;
}

type NextMdxLoader = (this: MdxLoaderContext, source: string) => void;

const isNextMdxLoader = (value: unknown): value is NextMdxLoader =>
  typeof value === "function";

if (!isNextMdxLoader(loadedNextMdxLoader)) {
  throw new TypeError("Expected @next/mdx to expose its MDX loader.");
}

const nextMdxLoader = loadedNextMdxLoader;

const compileArticle = async (source: string): Promise<string> =>
  await new Promise((resolve, reject) => {
    const context: MdxLoaderContext = {
      _compiler: {},
      context: process.cwd(),
      mode: "production",
      resourcePath: path.join(
        process.cwd(),
        "src/modules/blog/articles/example/example.mdx"
      ),
      sourceMap: false,
      getOptions: () => ({
        remarkPlugins: ["remark-gfm", articleContractPlugin],
      }),
      async: () => (error, result) => {
        if (error !== undefined) {
          reject(error);
          return;
        }
        resolve(Buffer.from(result ?? []).toString("utf-8"));
      },
    };

    nextMdxLoader.call(context, source);
  });

describe("Article compilation contract", () => {
  test("compiles semantic prose and deterministic private facts", async () => {
    const compiled = await compileArticle(`## Intro

Plain **strong** prose with \`inline code\`.

- One
- Two

> A useful quote.

## Intro
`);

    expect(compiled).toContain('id: "intro"');
    expect(compiled).toContain('id: "intro-1"');
    expect(compiled).toContain(
      'export const __articleFacts = JSON.parse("{\\"headings\\":[{\\"depth\\":2,\\"id\\":\\"intro\\",\\"text\\":\\"Intro\\"},{\\"depth\\":2,\\"id\\":\\"intro-1\\",\\"text\\":\\"Intro\\"}],\\"links\\":[],\\"searchText\\":\\"Intro Plain strong prose with inline code. One Two A useful quote. Intro\\"}")'
    );
  });

  test("rejects a body-level h1 with a stable diagnostic", async () => {
    await expect(compileArticle("# Body title")).rejects.toThrow(
      /blog\/heading-h1.*Article bodies begin at h2/u
    );
  });

  test("aggregates positional Article diagnostics in source order", async () => {
    await expect(compileArticle("# Bad title\n\n{unsafe}")).rejects.toThrow(
      /Article compilation failed with 2 contract violations:[\s\S]*1:1.*blog\/heading-h1[\s\S]*3:1.*blog\/expression[\s\S]*Article "example"/u
    );
  });

  test("rejects executable and unsupported Markdown output", async () => {
    const invalidSources = [
      ["raw HTML", "<div>unsafe</div>", "blog/raw-html"],
      ["an expression", "Before {answer} after", "blog/expression"],
      ["an export", "export const answer = 42", "blog/export"],
      ["arbitrary JSX", "<Widget />", "blog/element"],
      ["lowercase JSX", "<aside>Aside</aside>", "blog/raw-html"],
      ["a Markdown image", "![alternative](./image.png)", "blog/image"],
      ["a footnote", "Text[^one]\n\n[^one]: Note", "blog/footnote"],
    ] as const;

    await Promise.all(
      invalidSources.map(async ([name, source, ruleId]) => {
        await expect(
          compileArticle(source),
          `Expected ${name} to fail`
        ).rejects.toThrow(ruleId);
      })
    );
  });

  test("exports ordered link facts and validates local link policy", async () => {
    const compiled = await compileArticle(`## Section

[Same](#section)
[Article](/blog/another#intro)
[App](/)
[External](https://example.com/search?q=mdx#result)
[Reference][guide]

[guide]: /blog/another#intro
`);

    expect(compiled).toContain(
      '\\"links\\":[{\\"href\\":\\"#section\\"},{\\"href\\":\\"/blog/another#intro\\"},{\\"href\\":\\"/\\"},{\\"href\\":\\"https://example.com/search?q=mdx#result\\"},{\\"href\\":\\"/blog/another#intro\\"}]'
    );

    const invalidLinks = [
      ["[Missing](#missing)", "blog/link-fragment"],
      ["[Query](/about?mode=full)", "blog/link-query"],
      ["[Protocol relative](//example.com)", "blog/link-internal"],
      ["[HTTP](http://example.com)", "blog/link-scheme"],
      ["[Email](mailto:hello@example.com)", "blog/link-scheme"],
      ["[Relative](../another)", "blog/link-relative"],
      ["[Unsafe][target]\n\n[target]: javascript:alert(1)", "blog/link-scheme"],
    ] as const;

    await Promise.all(
      invalidLinks.map(async ([source, ruleId]) => {
        await expect(compileArticle(source)).rejects.toThrow(ruleId);
      })
    );
  });

  test("accepts only accessible Figures backed by consumed local imports", async () => {
    const compiled =
      await compileArticle(`import diagram from "./assets/diagram.png"

## Diagram

<Figure src={diagram} alt="Cache request flow">
  A *caption* with [details](https://example.com/details).
</Figure>
`);

    expect(compiled).toContain('import diagram from "./assets/diagram.png"');
    expect(compiled).toContain("src: diagram");
    expect(compiled).toContain('alt: "Cache request flow"');
    expect(compiled).toContain(
      '\\"searchText\\":\\"Diagram A caption with details.\\"'
    );
    expect(compiled).not.toContain("Cache request flow\\");

    const invalidFigures = [
      [
        'import image from "./assets/image.png"\n\n<Figure src={image} />',
        "blog/figure-alternative",
      ],
      [
        'import image from "./assets/image.png"\n\n<Figure src={image} alt="Useful" decorative />',
        "blog/figure-alternative",
      ],
      [
        'import image from "./assets/image.png"\n\n<Figure src={image} alt="   " />',
        "blog/figure-alt",
      ],
      ["<Figure src={missing} decorative />", "blog/figure-source"],
      [
        'import image from "./assets/image.png"\n\n<Figure src={image} decorative className="wide" />',
        "blog/figure-prop",
      ],
      ['import image from "./assets/image.png"', "blog/import-unused"],
      [
        'import image from "./assets/image.png"\n\n<Figure src={image} alt="Outer"><Figure src={image} alt="Inner" /></Figure>',
        "blog/figure-caption",
      ],
    ] as const;

    await Promise.all(
      invalidFigures.map(async ([source, ruleId]) => {
        await expect(compileArticle(source)).rejects.toThrow(ruleId);
      })
    );
  });

  test("reports every independently invalid Figure attribute", async () => {
    const failure = await compileArticle(
      '<Figure src="missing.png" alt=" " className="wide" decorative={false} />'
    ).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(Error);
    if (!(failure instanceof Error)) {
      throw new TypeError("Expected Figure compilation to fail.");
    }
    expect(failure.message).toMatch(/blog\/figure-source/u);
    expect(failure.message).toMatch(/blog\/figure-alt/u);
    expect(failure.message).toMatch(/blog\/figure-prop/u);
    expect(failure.message).toMatch(/blog\/figure-alternative/u);
  });

  test("compiles approved GFM and excludes code bodies and URLs from search facts", async () => {
    const compiled = await compileArticle(`## Über & Cache

~~Removed~~ and [documentation](https://example.com/docs).

| Mode | Result |
| --- | --- |
| Static | Fast |

- [x] Verified
- [ ] Pending

---

\`\`\`ts
const secretCodeBody = true
\`\`\`
`);

    expect(compiled).toContain('id: "über--cache"');
    expect(compiled).toContain("_components.table");
    expect(compiled).toContain("_components.del");
    expect(compiled).toContain('type: "checkbox"');
    expect(compiled).toContain("disabled: true");
    expect(compiled).toContain("_components.hr");
    expect(compiled).toContain(
      '\\"searchText\\":\\"Über & Cache Removed and documentation. Mode Result Static Fast Verified Pending\\"'
    );
    expect(compiled).not.toContain(
      '\\"searchText\\":\\"Über & Cache Removed and documentation. Mode Result Static Fast Verified Pending const secretCodeBody'
    );
  });
});
