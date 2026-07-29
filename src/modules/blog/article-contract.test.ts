import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vite-plus/test";

import type { ArticleCodeThemes } from "./article-code-theme-contract.mts";

const require = createRequire(import.meta.url);
const nextMdxEntry = require.resolve("@next/mdx");
const loadedNextMdxLoader: unknown = require(
  path.join(path.dirname(nextMdxEntry), "mdx-js-loader.js")
);
const articleContractPlugin = fileURLToPath(
  new URL("article-contract.mts", import.meta.url)
);
const articleCodePlugin = fileURLToPath(
  new URL("article-code.mts", import.meta.url)
);

interface MdxLoaderContext {
  readonly _compiler: object;
  readonly context: string;
  readonly mode: "production";
  readonly resourcePath: string;
  readonly sourceMap: false;
  readonly getOptions: () => {
    readonly rehypePlugins: readonly [
      readonly [
        string,
        {
          readonly themes: ArticleCodeThemes;
        },
      ],
    ];
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

const FIXTURE_CODE_THEMES: ArticleCodeThemes = {
  dark: "github-dark",
  light: "github-light",
};

const compileArticle = async (
  source: string,
  themes: ArticleCodeThemes = FIXTURE_CODE_THEMES
): Promise<string> =>
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
        rehypePlugins: [
          [
            articleCodePlugin,
            {
              themes,
            },
          ],
        ],
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

  test("highlights the closed language allowlist with a dual-theme output", async () => {
    const languages = [
      "",
      "text",
      "bash",
      "css",
      "html",
      "js",
      "jsx",
      "json",
      "md",
      "mdx",
      "ts",
      "tsx",
      "yaml",
      "diff",
    ] as const;

    await Promise.all(
      languages.map(async (language) => {
        const compiled = await compileArticle(
          `\`\`\`${language}\nconst answer = 42\n\`\`\``
        );
        expect(compiled).toContain("data-copy-source");
        if (language !== "" && language !== "text") {
          expect(compiled).toContain("--shiki-dark");
        }
      })
    );

    await expect(compileArticle("```python\nprint('no')\n```")).rejects.toThrow(
      /blog\/code-language.*python/u
    );

    const alternateThemes = await compileArticle(
      "```ts\nconst themed = true\n```",
      {
        dark: "vitesse-dark",
        light: "vitesse-light",
      }
    );
    expect(alternateThemes).toContain(
      "shiki-themes vitesse-light vitesse-dark"
    );
  });

  test("validates fence metadata and rendering annotations", async () => {
    const compiled =
      await compileArticle(`\`\`\`ts title="Example" lineNumbers=3
const answer = 42 // [!code highlight]
const focused = answer // [!code focus]
const changed = focused // [!code ++]
console.log(changed) // [!code word:changed]
\`\`\``);

    expect(compiled).toContain("data-code-title");
    expect(compiled).toContain("data-line-numbers-start");
    expect(compiled).toContain("highlighted");
    expect(compiled).toContain("focused");
    expect(compiled).toContain("diff add");
    expect(compiled).toContain("highlighted-word");
    expect(compiled).not.toContain("[!code");

    const invalid = [
      ["```ts mystery\nvalue\n```", "blog/code-meta"],
      ['```ts title="unterminated\nvalue\n```', "blog/code-meta"],
      ["```ts lineNumbers=0\nvalue\n```", "blog/code-line-numbers"],
      ["```ts twoslash=false\nvalue\n```", "blog/code-meta"],
      ["```js twoslash\nvalue\n```", "blog/code-twoslash-language"],
      ["```ts\nvalue // [!code unknown]\n```", "blog/code-annotation"],
      ["```ts\nvalue // [!code word:]\n```", "blog/code-annotation"],
    ] as const;

    await Promise.all(
      invalid.map(async ([source, ruleId]) => {
        await expect(compileArticle(source)).rejects.toThrow(ruleId);
      })
    );
  });

  test("groups only valid consecutive tabbed fences", async () => {
    const compiled =
      await compileArticle(`\`\`\`ts tab="TypeScript" tab-group="runtime"
const language = "ts"
\`\`\`

\`\`\`js tab="JavaScript"
const language = "js"
\`\`\`

Paragraph.

\`\`\`bash tab="Shell"
echo first
\`\`\`
\`\`\`text tab="Text"
first
\`\`\``);

    expect(compiled).toContain("{CodeTabs} = _components");
    expect(compiled).toContain('groupId: "runtime"');
    expect(compiled).toContain('labels: "[\\"TypeScript\\",\\"JavaScript\\"]"');

    const invalid = [
      ['```ts tab="Only"\nvalue\n```', "blog/code-tabs-size"],
      [
        '```ts tab="Same"\na\n```\n```js tab="Same"\nb\n```',
        "blog/code-tabs-label",
      ],
      [
        '```ts tab="First"\na\n```\n```js tab="Second" tab-group="late"\nb\n```',
        "blog/code-tabs-group",
      ],
      ['```ts tab="Tabbed"\na\n```\n```js\nb\n```', "blog/code-tabs-boundary"],
    ] as const;

    await Promise.all(
      invalid.map(async ([source, ruleId]) => {
        await expect(compileArticle(source)).rejects.toThrow(ruleId);
      })
    );
  });

  test("produces clean copy source and deterministic offline Twoslash output", async () => {
    const source = `\`\`\`ts twoslash
const ordinary = "kept" // ordinary comment  
const highlighted = ordinary // [!code highlight]
const answer: number = 42
//    ^?
\`\`\``;
    const previousFetch = globalThis.fetch;
    globalThis.fetch = () => {
      throw new Error("Article compilation attempted network access.");
    };

    try {
      const first = await compileArticle(source);
      const second = await compileArticle(source);
      expect(first).toBe(second);
      expect(first).toContain("twoslash");
      expect(first).toContain("ordinary comment");
      expect(first).not.toContain("[!code");
      expect(first).not.toContain("^?");
      expect(first).toContain(
        '"data-copy-source": "const ordinary = \\"kept\\" // ordinary comment  \\n'
      );
    } finally {
      globalThis.fetch = previousFetch;
    }

    await expect(
      compileArticle("```ts twoslash\nconst value: string = 42\n```")
    ).rejects.toThrow();
    await expect(
      compileArticle(
        '```ts twoslash\nimport value from "./relative"\nconsole.log(value)\n```'
      )
    ).rejects.toThrow(/blog\/twoslash-import/u);
    await expect(
      compileArticle('```ts twoslash\nconst value = import("./relative")\n```')
    ).rejects.toThrow(/blog\/twoslash-import/u);

    const teachingError = await compileArticle(`\`\`\`ts twoslash
// @errors: 2322
const teaching: string = 42
\`\`\``);
    expect(teachingError).toContain("twoslash");
    expect(teachingError).not.toContain("@errors");

    const tsx = await compileArticle(`\`\`\`tsx twoslash
const view = <div>Hello</div>
\`\`\``);
    expect(tsx).toContain("twoslash");
    expect(tsx).toContain("Hello");

    const diffWithFinalNewline = await compileArticle(`\`\`\`diff
-old
+new

\`\`\``);
    expect(diffWithFinalNewline).toContain(
      '"data-copy-source": "-old\\n+new\\n"'
    );
  });
});
