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
    const compiled = await compileArticle(`import { Circle } from "lucide-react"

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

    expect(compiled).toContain('import {Circle} from "lucide-react"');
    expect(compiled).toContain('id: "overview-heading"');
    expect(compiled).toContain('id: "nested-heading"');
    expect(compiled).toContain("defaultOpen: true");
    expect(compiled).toContain(
      '\\"searchText\\":\\"Overview Overview heading First panel prose. Details Initially open Nested heading Nested searchable prose. Initially closed Closed searchable prose.\\"'
    );
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

  test("compiles the approved static Article compositions and visitor labels", async () => {
    const compiled =
      await compileArticle(`import { RocketIcon } from "lucide-react"

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

    expect(compiled).toContain(
      "{Callout, Card, Cards, File, Files, Folder, Kbd, Step, Steps}"
    );
    expect(compiled).toContain("RocketIcon");
    expect(compiled).toContain(
      '\\"searchText\\":\\"Start here Read the guide first. Deploy Ship with confidence. Inspect Review the output. app blog page.tsx layout.tsx package.json Install Run Enter. Verify Check the result. src app page.tsx package.json\\"'
    );
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
    const compiled = await compileArticle(`\`\`\`files
app/
├── components/
│   └── button.tsx
└── page.tsx
\`\`\``);

    expect(compiled).toContain(
      '\\"searchText\\":\\"app components button.tsx page.tsx\\"'
    );
  });
});
