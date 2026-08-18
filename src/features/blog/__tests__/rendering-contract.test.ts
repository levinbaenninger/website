import { compile, evaluate } from "@mdx-js/mdx";
import type { MDXComponents } from "mdx/types";
import { createElement } from "react";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as runtime from "react/jsx-runtime";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";

import type { ArticleCompilationFacts } from "@/features/blog/articles/facts.ts";
import type { ArticleCodeThemes } from "@/features/blog/rendering/code/code-theme-contract.ts";
import { loadArticleMdxProcessorOptions } from "@/features/blog/rendering/compiler.ts";
import { ArticleCodeBlock } from "@/features/blog/rendering/components.tsx";
import {
  ArticleAccordion,
  ArticleTabs,
} from "@/features/blog/rendering/interactions.tsx";
import { getArticleMdxComponents } from "@/features/blog/rendering/mdx-components.ts";

const FIXTURE_CODE_THEMES: ArticleCodeThemes = {
  dark: "github-dark",
  light: "github-light",
};

const articleFixture = (source: string) => ({
  path: "src/features/blog/articles/example/example.mdx",
  value: source,
});

const compileArticle = async (
  source: string,
  themes: ArticleCodeThemes = FIXTURE_CODE_THEMES
): Promise<{
  readonly facts: ArticleCompilationFacts;
}> => {
  const file = await compile(
    articleFixture(source),
    await loadArticleMdxProcessorOptions(themes)
  );
  const facts = file.data.articleFacts as ArticleCompilationFacts | undefined;
  if (facts === undefined) {
    throw new TypeError("Expected Article compilation to expose facts.");
  }
  return { facts };
};

const renderArticle = async (
  source: string,
  themes: ArticleCodeThemes = FIXTURE_CODE_THEMES,
  componentOverrides: MDXComponents = {}
): Promise<{
  readonly codeBlocks: readonly ComponentProps<typeof ArticleCodeBlock>[];
  readonly facts: ArticleCompilationFacts;
  readonly markup: string;
}> => {
  const article = await evaluate(articleFixture(source), {
    ...runtime,
    ...(await loadArticleMdxProcessorOptions(themes)),
    baseUrl: import.meta.url,
  });
  const facts = article.__articleFacts as ArticleCompilationFacts | undefined;
  if (facts === undefined) {
    throw new TypeError("Expected evaluated Article to export facts.");
  }
  const codeBlocks: ComponentProps<typeof ArticleCodeBlock>[] = [];
  const RecordingCodeBlock = (
    props: ComponentProps<typeof ArticleCodeBlock>
  ) => {
    codeBlocks.push(props);
    return createElement(ArticleCodeBlock, props);
  };
  return {
    codeBlocks,
    facts,
    markup: renderToStaticMarkup(
      createElement(article.default, {
        components: {
          ...getArticleMdxComponents(),
          ...componentOverrides,
          pre: RecordingCodeBlock,
        },
      })
    ),
  };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Article compilation contract", () => {
  test("lowers authored panels into stable compiler-owned models", async () => {
    let accordionProps: ComponentProps<typeof ArticleAccordion> | undefined;
    let tabsProps: ComponentProps<typeof ArticleTabs> | undefined;
    const RecordingAccordion = (
      props: ComponentProps<typeof ArticleAccordion>
    ) => {
      accordionProps = props;
      return createElement(ArticleAccordion, props);
    };
    const RecordingTabs = (props: ComponentProps<typeof ArticleTabs>) => {
      tabsProps = props;
      return createElement(ArticleTabs, props);
    };

    const article = await renderArticle(
      `import { RocketIcon } from "lucide-react"

<Accordion>
  <AccordionItem title="First" defaultOpen>First body</AccordionItem>
  <AccordionItem title="Second">Second body</AccordionItem>
</Accordion>

<Tabs>
  <Tab title="Alpha" icon={<RocketIcon />}>Alpha body</Tab>
  <Tab title="Beta">Beta body</Tab>
</Tabs>`,
      FIXTURE_CODE_THEMES,
      { Accordion: RecordingAccordion, Tabs: RecordingTabs }
    );

    expect(JSON.parse(accordionProps?.panels ?? "null")).toStrictEqual([
      { defaultOpen: true, label: "First", value: "accordion-item-0" },
      { defaultOpen: false, label: "Second", value: "accordion-item-1" },
    ]);
    expect(JSON.parse(tabsProps?.panels ?? "null")).toStrictEqual([
      { iconSlot: "tabIcon0", label: "Alpha", value: "tab-0" },
      { label: "Beta", value: "tab-1" },
    ]);
    expect(article.markup).toContain('class="lucide lucide-rocket"');
  });

  test("compiles semantic prose and deterministic private facts", async () => {
    const article = await renderArticle(`## Intro

Plain **strong** prose with \`inline code\`.

- One
- Two

> A useful quote.

## Intro
`);

    expect(article.facts).toStrictEqual({
      headings: [
        { depth: 2, id: "intro", text: "Intro" },
        { depth: 2, id: "intro-1", text: "Intro" },
      ],
      links: [],
      searchText:
        "Intro Plain strong prose with inline code. One Two A useful quote. Intro",
    });
    expect(article.markup).toContain(
      '<h2 id="intro"><a data-article-heading-anchor="" href="#intro">Intro</a>'
    );
    expect(article.markup).toContain(
      '<h2 id="intro-1"><a data-article-heading-anchor="" href="#intro-1">Intro</a>'
    );
    expect(article.markup).toContain("<strong>strong</strong>");
    expect(article.markup).toContain("<blockquote>");
  });

  test("rejects a body-level h1 with a stable diagnostic", async () => {
    await expect(compileArticle("# Body title")).rejects.toThrow(
      /blog\/heading-h1.*Article bodies begin at h2/u
    );
  });

  test("keeps the Article outline at depth two through four", async () => {
    const outline = await compileArticle("## Two\n\n### Three\n\n#### Four");

    expect(outline.facts.headings).toStrictEqual([
      { depth: 2, id: "two", text: "Two" },
      { depth: 3, id: "three", text: "Three" },
      { depth: 4, id: "four", text: "Four" },
    ]);
    await expect(compileArticle("##### Five")).rejects.toThrow(
      /blog\/heading-depth.*Heading depth 5 is outside the Article outline/u
    );
    await expect(compileArticle("###### Six")).rejects.toThrow(
      /blog\/heading-depth.*Heading depth 6 is outside the Article outline/u
    );
  });

  test("rejects a link inside a heading that is already a link", async () => {
    await expect(
      compileArticle("## See [the docs](https://example.com/docs)")
    ).rejects.toThrow(
      /blog\/heading-link.*Article headings are their own section link/u
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
    const { facts } = await compileArticle(`## Section

[Same](#section)
[Article](/blog/another#intro)
[App](/)
[External](https://example.com/search?q=mdx#result)
[Reference][guide]

[guide]: /blog/another#intro
`);

    expect(facts.links).toStrictEqual([
      { href: "#section" },
      { href: "/blog/another#intro" },
      { href: "/" },
      { href: "https://example.com/search?q=mdx#result" },
      { href: "/blog/another#intro" },
    ]);

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
    const { facts } =
      await compileArticle(`import diagram from "./assets/diagram.png"

## Diagram

<Figure src={diagram} alt="Cache request flow">
  A *caption* with [details](https://example.com/details).
</Figure>
`);

    expect(facts).toStrictEqual({
      headings: [{ depth: 2, id: "diagram", text: "Diagram" }],
      links: [{ href: "https://example.com/details" }],
      searchText: "Diagram A caption with details.",
    });

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
      [
        'import Tabs from "./assets/image.png"\n\n<Figure src={Tabs} alt="Shadow" />\n\n<Tabs><Tab title="One">One</Tab><Tab title="Two">Two</Tab></Tabs>',
        "blog/import-shadow",
      ],
    ] as const;

    await Promise.all(
      invalidFigures.map(async ([source, ruleId]) => {
        await expect(compileArticle(source)).rejects.toThrow(ruleId);
      })
    );
  });

  test("compiles validated Accordions and Tabs with searchable hidden content", async () => {
    const article = await renderArticle(`import { Circle } from "lucide-react"

<Tabs>
  <Tab title="Overview" icon={<Circle />}>
    ## Overview heading

    First panel prose.
  </Tab>
  <Tab title="Details">
    <Accordion>
      <AccordionItem title="Initially open" defaultOpen>
        ### Nested heading

        Nested searchable prose.
      </AccordionItem>
      <AccordionItem title="Initially closed">
        Closed searchable prose.
      </AccordionItem>
    </Accordion>
  </Tab>
</Tabs>
`);

    expect(article.facts).toStrictEqual({
      headings: [
        { depth: 2, id: "overview-heading", text: "Overview heading" },
        { depth: 3, id: "nested-heading", text: "Nested heading" },
      ],
      links: [],
      searchText:
        "Overview Overview heading First panel prose. Details Initially open Nested heading Nested searchable prose. Initially closed Closed searchable prose.",
    });
    expect(article.markup).toContain('role="tablist"');
    expect(article.markup).toContain('id="overview-heading"');
    expect(article.markup).toContain('id="nested-heading"');
    expect(article.markup).toContain('aria-expanded="true"');
  });

  test("rejects invalid Accordion and Tabs composition with stable diagnostics", async () => {
    const invalidSources = [
      ["an empty Accordion", "<Accordion />", "blog/accordion-children"],
      [
        "Accordion prose",
        "<Accordion>Not an item</Accordion>",
        "blog/accordion-children",
      ],
      [
        "an untitled Accordion item",
        "<Accordion><AccordionItem>Body</AccordionItem></Accordion>",
        "blog/accordion-item-title",
      ],
      [
        "an Accordion item value",
        '<Accordion><AccordionItem title="Title" value="custom">Body</AccordionItem></Accordion>',
        "blog/accordion-item-prop",
      ],
      [
        "an empty Accordion item",
        '<Accordion><AccordionItem title="Title" /></Accordion>',
        "blog/accordion-item-children",
      ],
      [
        "an authored Accordion state",
        '<Accordion value="open"><AccordionItem title="Title">Body</AccordionItem></Accordion>',
        "blog/accordion-prop",
      ],
      [
        "a non-boolean Accordion default",
        '<Accordion><AccordionItem title="Title" defaultOpen={false}>Body</AccordionItem></Accordion>',
        "blog/accordion-item-default",
      ],
      [
        "interactive Accordion item content",
        '<Accordion><AccordionItem title="Title"><Tabs><Tab title="One">One</Tab><Tab title="Two">Two</Tab></Tabs></AccordionItem></Accordion>',
        "blog/accordion-item-children",
      ],
      [
        "a lone Tab",
        '<Tabs><Tab title="One">One</Tab></Tabs>',
        "blog/tabs-count",
      ],
      [
        "duplicate Tab titles",
        '<Tabs><Tab title="Same">One</Tab><Tab title="Same">Two</Tab></Tabs>',
        "blog/tab-title-duplicate",
      ],
      [
        "an authored Tab value",
        '<Tabs><Tab title="One" value="one">One</Tab><Tab title="Two">Two</Tab></Tabs>',
        "blog/tab-prop",
      ],
      [
        "an empty Tab",
        '<Tabs><Tab title="One" /><Tab title="Two">Two</Tab></Tabs>',
        "blog/tab-children",
      ],
      [
        "nested general Tabs",
        '<Tabs><Tab title="One"><Tabs><Tab title="A">A</Tab><Tab title="B">B</Tab></Tabs></Tab><Tab title="Two">Two</Tab></Tabs>',
        "blog/tabs-nested",
      ],
      [
        "a standalone item",
        '<AccordionItem title="Title">Body</AccordionItem>',
        "blog/accordion-item-parent",
      ],
      [
        "a standalone panel",
        '<Tab title="Title">Body</Tab>',
        "blog/tab-parent",
      ],
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

  test("limits Lucide imports to zero-prop general Tab icons", async () => {
    const invalidSources = [
      [
        'import { Tabs } from "lucide-react"\n\n<Tabs><Tab title="One" icon={<Tabs />}>One</Tab><Tab title="Two">Two</Tab></Tabs>',
        "blog/import-shadow",
      ],
      [
        'import { Circle as Icon } from "lucide-react"\n\n<Tabs><Tab title="One" icon={<Icon />}>One</Tab><Tab title="Two">Two</Tab></Tabs>',
        "blog/icon-import",
      ],
      [
        'import Circle from "lucide-react"\n\n<Tabs><Tab title="One" icon={<Circle />}>One</Tab><Tab title="Two">Two</Tab></Tabs>',
        "blog/icon-import",
      ],
      [
        'import { Circle } from "lucide-react"\n\n<Circle />',
        "blog/icon-position",
      ],
      [
        'import { Circle } from "lucide-react"\n\n<Tabs><Tab title="One" icon={<Circle size={12} />}>One</Tab><Tab title="Two">Two</Tab></Tabs>',
        "blog/tab-icon",
      ],
      [
        'import { Circle } from "lucide-react"\n\n<Tabs><Tab title="One">One</Tab><Tab title="Two">Two</Tab></Tabs>',
        "blog/import-unused",
      ],
      [
        '<Tabs><Tab title="One" icon={<Circle />}>One</Tab><Tab title="Two">Two</Tab></Tabs>',
        "blog/tab-icon",
      ],
    ] as const;

    await Promise.all(
      invalidSources.map(async ([source, ruleId]) => {
        await expect(compileArticle(source)).rejects.toThrow(ruleId);
      })
    );
  });

  test("reports interactive contract values at their source positions", async () => {
    const failure = await compileArticle(`<Tabs>
  <Tab>Missing title</Tab>
  <Tab title="Valid">Valid panel</Tab>
</Tabs>`).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(Error);
    if (!(failure instanceof Error)) {
      throw new TypeError("Expected Tabs compilation to fail.");
    }
    expect(failure.message).toMatch(
      /2:3.*blog\/tab-title.*title undefined is invalid.*Use one literal/u
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
    const article = await renderArticle(`## Über & Cache

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

    expect(article.facts).toStrictEqual({
      headings: [{ depth: 2, id: "über--cache", text: "Über & Cache" }],
      links: [{ href: "https://example.com/docs" }],
      searchText:
        "Über & Cache Removed and documentation. Mode Result Static Fast Verified Pending",
    });
    expect(article.markup).toContain('<h2 id="über--cache">');
    expect(article.markup).toContain("<del>Removed</del>");
    expect(article.markup).toContain("<table");
    expect(article.markup).toContain('type="checkbox"');
    expect(article.markup).toContain("disabled");
    expect(article.markup).toContain("<hr");
    expect(article.markup).not.toContain(
      "Über &amp; Cache Removed and documentation. Mode Result Static Fast Verified Pending const secretCodeBody"
    );
  });

  test("compiles the approved static Article compositions and visitor labels", async () => {
    const article =
      await renderArticle(`import { RocketIcon } from "lucide-react"

<Callout kind="tip" title="Start here">
  Read the **guide** first.
</Callout>

<Cards>
  <Card title="Deploy" href="/blog/deploy" icon={<RocketIcon />}>
    Ship with confidence.
  </Card>
  <Card title="Inspect">
    Review the output.
  </Card>
</Cards>

<Files>
  <Folder name="app" defaultOpen>
    <Folder name="blog">
      <File name="page.tsx" />
    </Folder>
    <File name="layout.tsx" />
  </Folder>
  <File name="package.json" />
</Files>

<Steps>
  <Step title="Install">Run <Kbd>Enter</Kbd>.</Step>
  <Step title="Verify">Check the result.</Step>
</Steps>

\`\`\`files
src/
  app/
    page.tsx
package.json
\`\`\`
`);

    expect(article.facts.searchText).toBe(
      "Start here Read the guide first. Deploy Ship with confidence. Inspect Review the output. app blog page.tsx layout.tsx package.json Install Run Enter. Verify Check the result. src app page.tsx package.json"
    );
    expect(article.markup).toContain("<aside");
    expect(article.markup).toContain('<a href="/blog/deploy"');
    expect(article.markup).toContain('aria-label="app folder"');
    expect(article.markup).toContain("layout.tsx");
    expect(article.markup).toContain("<kbd");
  });

  test("rejects invalid static composition props and nesting", async () => {
    const invalidSources = [
      ['<Callout kind="info">Text</Callout>', "blog/callout-kind"],
      ['<Callout kind="note" />', "blog/callout-children"],
      [
        '<Callout kind="tip" title={"Computed"}>Text</Callout>',
        "blog/callout-title",
      ],
      ['<Callout kind="tip" {...settings}>Text</Callout>', "blog/callout-prop"],
      ['<Callouts kind="tip">Alias</Callouts>', "blog/element"],
      ['<Layout.Callout kind="tip">Member</Layout.Callout>', "blog/element"],
      ["<Cards><p>Wrong child</p></Cards>", "blog/cards-children"],
      ['<Card title="Orphan">Text</Card>', "blog/card-position"],
      ["<Cards><Card>Missing title</Card></Cards>", "blog/card-title"],
      [
        '<Cards><Card title="Computed" href={"/target"} /></Cards>',
        "blog/card-href",
      ],
      [
        '<Cards><Card title={{ label: "Object" }} /></Cards>',
        "blog/card-title",
      ],
      ['<Cards><Card title={["Array"]} /></Cards>', "blog/card-title"],
      ['<Cards><Card title={() => "Callback"} /></Cards>', "blog/card-title"],
      ["<Cards><Card title={`Template`} /></Cards>", "blog/card-title"],
      [
        '<Cards><Card title="Linked" href="/target">[Nested](/other)</Card></Cards>',
        "blog/card-interactive",
      ],
      [
        '<Cards>\n<Card title="Linked" href="/target">\n\n- [ ] Task\n\n</Card>\n</Cards>',
        "blog/card-interactive",
      ],
      [
        '<Cards><Card title="Static">Press <Kbd>K</Kbd></Card></Cards>',
        "blog/card-children",
      ],
      [
        '<Files><File name="one"><File name="two" /></File></Files>',
        "blog/file-children",
      ],
      [
        '<Files><Folder name="app">Prose</Folder></Files>',
        "blog/folder-children",
      ],
      ['<Folder name="app" />', "blog/folder-position"],
      ['<Files><File name="nested/path.ts" /></Files>', "blog/file-name"],
      ["<Steps />", "blog/steps-children"],
      [
        '<Steps><Step title="One" extra="no">Text</Step></Steps>',
        "blog/step-prop",
      ],
      ["Before <Kbd><strong>K</strong></Kbd>", "blog/kbd-children"],
      ["<Kbd>Block</Kbd>", "blog/kbd-position"],
    ] as const;

    await Promise.all(
      invalidSources.map(async ([source, ruleId]) => {
        await expect(compileArticle(source)).rejects.toThrow(ruleId);
      })
    );
  });

  test("enforces the narrow Lucide Card icon exception", async () => {
    const invalidSources = [
      [
        'import * as Icons from "lucide-react"\n\n<Cards><Card title="Bad" icon={<Icons.RocketIcon />} /></Cards>',
        "blog/icon-import",
      ],
      [
        'import { RocketIcon as LaunchIcon } from "lucide-react"\n\n<Cards><Card title="Bad" icon={<LaunchIcon />} /></Cards>',
        "blog/icon-import",
      ],
      [
        'import { RocketIcon } from "lucide-react"\n\n<Cards><Card title="Bad" icon={<RocketIcon size={12} />} /></Cards>',
        "blog/card-icon",
      ],
      [
        'import { DefinitelyNotAnIcon } from "lucide-react"\n\n<Cards><Card title="Bad" icon={<DefinitelyNotAnIcon />} /></Cards>',
        "blog/icon-import",
      ],
      [
        'import { RocketIcon } from "lucide-react"\n\n<RocketIcon />',
        "blog/icon-position",
      ],
      [
        'import { RocketIcon } from "lucide-react"\n\n<Cards><Card title="No icon" /></Cards>',
        "blog/import-unused",
      ],
    ] as const;

    await Promise.all(
      invalidSources.map(async ([source, ruleId]) => {
        await expect(compileArticle(source)).rejects.toThrow(ruleId);
      })
    );
  });

  test("validates the files fence shorthand", async () => {
    const invalidSources = [
      ["```files\n  orphan.ts\n```", "blog/files-fence"],
      ["```files\nsrc/\n   uneven.ts\n```", "blog/files-fence"],
      ["```files\nsrc/\nsrc/\n```", "blog/files-fence"],
      ['```files title="Tree"\nsrc/\n```', "blog/files-fence"],
    ] as const;

    await Promise.all(
      invalidSources.map(async ([source, ruleId]) => {
        await expect(compileArticle(source)).rejects.toThrow(ruleId);
      })
    );
  });

  test("accepts the conventional box-drawing files shorthand", async () => {
    const { facts } = await compileArticle(`\`\`\`files
app/
├── components/
│   └── button.tsx
└── page.tsx
\`\`\``);

    expect(facts.searchText).toBe("app components button.tsx page.tsx");
  });

  test("renders the closed language allowlist as copyable code", async () => {
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
        const { codeBlocks, markup } = await renderArticle(
          `\`\`\`${language}\nconst answer = 42\n\`\`\``
        );
        expect(markup).toContain('aria-label="Copy code"');
        expect(codeBlocks).toHaveLength(1);
        expect(codeBlocks[0]?.["data-copy-source"]).toBe("const answer = 42");
      })
    );

    await expect(compileArticle("```python\nprint('no')\n```")).rejects.toThrow(
      /blog\/code-language.*python/u
    );
  });

  test("validates fence metadata and rendering annotations", async () => {
    const { codeBlocks, markup } =
      await renderArticle(`\`\`\`ts title="Example" lineNumbers=3
const answer = 42 // [!code highlight]
const focused = answer // [!code focus]
const changed = focused // [!code ++]
console.log(changed) // [!code word:changed]
\`\`\``);

    expect(markup).toContain("Example");
    expect(markup).toContain('data-line-numbers-start="3"');
    expect(markup).not.toContain("[!code");
    expect(codeBlocks[0]?.["data-copy-source"]).toBe(
      "const answer = 42\n" +
        "const focused = answer\n" +
        "const changed = focused\n" +
        "console.log(changed)"
    );
    expect(codeBlocks[0]?.["data-code-title"]).toBe("Example");
    expect(codeBlocks[0]?.["data-line-numbers-start"]).toBe("3");

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

  test("rejects long malformed rendering annotations promptly", async () => {
    const ambiguousEscapePairs = String.raw`\9`.repeat(4096);

    await expect(
      compileArticle(
        `\`\`\`ts\nvalue // [!code word:${ambiguousEscapePairs}\n\`\`\``
      )
    ).rejects.toThrow("blog/code-annotation");
  });

  test("groups only valid consecutive tabbed fences", async () => {
    const { markup } =
      await renderArticle(`\`\`\`ts tab="TypeScript" tab-group="runtime"
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

    expect(markup).toContain('role="tablist"');
    expect(markup).toContain(">TypeScript<");
    expect(markup).toContain(">JavaScript<");
    expect(markup).toContain(">Shell<");
    expect(markup).toContain(">Text<");

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
const ordinary = "kept" // ordinary comment${"  "}
const highlighted = ordinary // [!code highlight]
const answer: number = 42
//    ^?
\`\`\``;
    vi.stubGlobal("fetch", () => {
      throw new Error("Article compilation attempted network access.");
    });

    const first = await renderArticle(source);
    const second = await renderArticle(source);
    expect(second.facts).toStrictEqual(first.facts);
    expect(second.markup).toBe(first.markup);
    expect(second.codeBlocks[0]?.["data-copy-source"]).toBe(
      first.codeBlocks[0]?.["data-copy-source"]
    );
    expect(first.markup).toContain("ordinary comment");
    expect(first.markup).not.toContain("[!code");
    expect(first.markup).not.toContain("^?");
    expect(first.codeBlocks[0]?.["data-copy-source"]).toBe(
      'const ordinary = "kept" // ordinary comment  \n' +
        "const highlighted = ordinary\n" +
        "const answer: number = 42"
    );

    await expect(
      compileArticle("```ts twoslash\nconst value: string = 42\n```")
    ).rejects.toThrow(Error);
    await expect(
      compileArticle(
        "```ts twoslash\n// @noErrors\nconst value: string = 42\n```"
      )
    ).rejects.toThrow(/blog\/twoslash-directive/u);
    await expect(
      compileArticle(
        '```ts twoslash\nimport value from "./relative"\nconsole.log(value)\n```'
      )
    ).rejects.toThrow(/blog\/twoslash-import/u);
    await expect(
      compileArticle('```ts twoslash\nconst value = import("./relative")\n```')
    ).rejects.toThrow(/blog\/twoslash-import/u);

    const teachingError = await renderArticle(`\`\`\`ts twoslash
// @errors: 2322
const teaching: string = 42
\`\`\``);
    expect(teachingError.markup).not.toContain("@errors");

    const tsx = await renderArticle(`\`\`\`tsx twoslash
const view = <div>Hello</div>
\`\`\``);
    expect(tsx.markup).toContain("Hello");

    const diffWithFinalNewline = await renderArticle(`\`\`\`diff
-old
+new

\`\`\``);
    expect(diffWithFinalNewline.codeBlocks[0]?.["data-copy-source"]).toBe(
      "-old\n+new\n"
    );
  });

  test("groups tabbed fences nested inside approved compositions", async () => {
    const { markup } = await renderArticle(`<Steps>
  <Step title="Install">
\`\`\`bash tab="npm" tab-group="package-manager"
npm install
\`\`\`

\`\`\`bash tab="pnpm"
pnpm install
\`\`\`
  </Step>
</Steps>

<Tabs>
  <Tab title="Client">
\`\`\`ts tab="TypeScript"
const runtime = "ts"
\`\`\`

\`\`\`js tab="JavaScript"
const runtime = "js"
\`\`\`
  </Tab>
  <Tab title="Server">Nothing tabbed here.</Tab>
</Tabs>

<Accordion>
  <AccordionItem title="Details">
\`\`\`yaml tab="YAML"
key: value
\`\`\`

\`\`\`json tab="JSON"
{ "key": "value" }
\`\`\`
  </AccordionItem>
</Accordion>`);

    // Grouping walked the whole tree: nested runs used to reach the DOM as
    // labels with no strip.
    expect(markup.match(/data-code-tabs/gu)).toHaveLength(3);
    expect(markup).not.toContain("data-code-tab-label");
    for (const label of [
      "npm",
      "pnpm",
      "TypeScript",
      "JavaScript",
      "YAML",
      "JSON",
    ]) {
      expect(markup).toContain(`>${label}<`);
    }
    expect(markup).toContain('data-tab-group="package-manager"');
  });

  test("reports CodeTabs diagnostics at nested depth", async () => {
    // Nested mistakes used to compile cleanly and render as loose blocks.
    const invalid = [
      [
        '<Steps>\n  <Step title="One">\n```ts tab="Only"\nvalue\n```\n  </Step>\n</Steps>',
        "blog/code-tabs-size",
      ],
      [
        '<Tabs>\n  <Tab title="One">\n```ts tab="Same"\na\n```\n```js tab="Same"\nb\n```\n  </Tab>\n  <Tab title="Two">Other</Tab>\n</Tabs>',
        "blog/code-tabs-label",
      ],
      [
        '<Accordion>\n  <AccordionItem title="One">\n```ts tab="First"\na\n```\n```js\nb\n```\n  </AccordionItem>\n</Accordion>',
        "blog/code-tabs-boundary",
      ],
      [
        '<Steps>\n  <Step title="One">\n```ts tab="First"\na\n```\n```js tab="Second" tab-group="late"\nb\n```\n  </Step>\n</Steps>',
        "blog/code-tabs-group",
      ],
    ] as const;

    await Promise.all(
      invalid.map(async ([source, ruleId]) => {
        await expect(compileArticle(source)).rejects.toThrow(ruleId);
      })
    );
  });

  test("names every CodeBlock from its compiled language and title", async () => {
    const untitled = await renderArticle("```ts\nconst answer = 42\n```");
    expect(untitled.codeBlocks[0]?.["data-code-name"]).toBe(
      "TypeScript code example"
    );
    expect(untitled.markup).toContain('aria-label="TypeScript code example"');

    const titled = await renderArticle(
      '```bash title="install.sh"\nnpm install\n```'
    );
    expect(titled.codeBlocks[0]?.["data-code-name"]).toBe(
      "install.sh, Bash code example"
    );
  });

  test("emits both code themes without an authoritative inline background", async () => {
    const { markup } = await renderArticle("```ts\nconst answer = 42\n```");

    expect(markup).toContain("--shiki-light:");
    expect(markup).toContain("--shiki-dark:");
    // The frame owns the surface; an inline background could only be beaten with `!important`.
    expect(markup).not.toMatch(/style="[^"]*background-color:/u);
    expect(markup).not.toMatch(/style="[^"]*[^-]color:\s*#/u);
  });

  test("keeps compiled fence facts aligned across a Twoslash block", async () => {
    // Count `pre`s excluding Twoslash popup pres: an uncounted inner `pre`
    // used to shift later blocks' title, copy source, and line start.
    const { codeBlocks } = await renderArticle(`\`\`\`ts twoslash
const greeting: string = "hello"
\`\`\`

\`\`\`ts title="after.ts" lineNumbers=5
const after = 1
\`\`\``);

    expect(codeBlocks).toHaveLength(2);
    expect(codeBlocks[1]?.["data-code-title"]).toBe("after.ts");
    expect(codeBlocks[1]?.["data-line-numbers-start"]).toBe("5");
    expect(codeBlocks[1]?.["data-copy-source"]).toBe("const after = 1");
  });

  test("says what every annotation means in words as well as in colour", async () => {
    const { markup } = await renderArticle(`\`\`\`ts
const highlighted = 1 // [!code highlight]
const focused = 2 // [!code focus]
const added = 3 // [!code ++]
const removed = 4 // [!code --]
const worded = 5 // [!code word:worded]
\`\`\``);

    for (const label of [
      "Highlighted line: ",
      "Focused line: ",
      "Added line: ",
      "Removed line: ",
      "highlighted ",
    ]) {
      expect(markup).toContain(`data-code-annotation="">${label}<`);
    }
  });

  test("keeps Twoslash markup out of the Article code frame", async () => {
    const hover = await renderArticle(`\`\`\`ts twoslash
const greeting: string = "hello"
\`\`\``);

    // Compiler marks a popup `pre` so the global `pre` mapping leaves it alone.
    expect(hover.codeBlocks).toHaveLength(1);
    expect(hover.markup.match(/data-code-block/gu)).toHaveLength(1);
    // Popup is portalled, so it is client-only — explicit queries must not be one.
    expect(hover.markup).toContain('data-twoslash-trigger=""');
    expect(hover.markup).toContain('aria-haspopup="dialog"');
    expect(hover.markup).toContain(">greeting</button>");

    // Explicit ^? / expected-error stay static visible code, not a control.
    const explicit = await renderArticle(`\`\`\`ts twoslash
// @errors: 2322
const answer: number = 42
//    ^?
const teaching: string = 42
\`\`\``);
    expect(explicit.markup).toContain("twoslash-query-line");
    expect(explicit.markup).toContain("twoslash-error-line");
    expect(explicit.markup).toContain(
      "Type &#x27;number&#x27; is not assignable to type &#x27;string&#x27;."
    );
    // Authored `^?` is output under the line, not a trigger.
    expect(explicit.markup).not.toMatch(
      /twoslash-query-line[^>]*>[\s\S]*?data-twoslash-trigger/u
    );
  });
});
