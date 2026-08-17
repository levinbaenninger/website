import { evaluate } from "@mdx-js/mdx";
import type { MDXContent } from "mdx/types";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as runtime from "react/jsx-runtime";
import { beforeAll, describe, expect, test } from "vite-plus/test";

import { ArticleView } from "@/features/blog/articles/reader/view.tsx";
import type { ArticleDetail } from "@/features/blog/articles/types.ts";
import type { ArticleCodeThemes } from "@/features/blog/rendering/code/code-theme-contract.ts";
import { loadArticleMdxProcessorOptions } from "@/features/blog/rendering/compiler.ts";
import { getArticleMdxComponents } from "@/features/blog/rendering/mdx-components.ts";

const CODE_THEMES: ArticleCodeThemes = {
  dark: "github-dark",
  light: "github-light",
};

/*
 * Compiled in-memory rather than living under content/: an Article there would
 * move the manifest, catalog, search artifact, sitemap, and social images.
 */
const REPRESENTATIVE_ARTICLE = `## Reading an Article

Prose with \`inlineCode\`, a [same-Article fragment](#the-second-section), a
[root-relative destination](/blog), and an
[external destination](https://example.com/reference).

- One
- Two

1. First
2. Second

- [x] Done
- [ ] Outstanding

> A quoted aside.

---

### The second section

#### A depth-four heading

| Concept | Meaning |
| --- | --- |
| Outline | Depth two through four |
| Fragment | A stable compiled ID |

\`\`\`ts title="reader.ts" lineNumbers=1
const kept = "copied" // [!code highlight]
const removed = 1 // [!code --]
\`\`\`
`;

// Figures stay in components.test.tsx: the contract only accepts an imported Article-local image binding.
const RICH_ARTICLE = `## Compositions

<Callout kind="note" title="A note">
  Notes carry context, including a [link](https://example.com/docs) and \`code\`.

  A second paragraph, so the Callout's own rhythm is exercised.
</Callout>

<Callout kind="danger">Danger has no title, which is the shorter shape.</Callout>

<Cards>
  <Card href="/blog/deploy" title="A linked Card">
    One destination, and no interactive children.
  </Card>
  <Card title="An unlinked Card">
    Static, and free to carry a [link](https://example.com) of its own.
  </Card>
  <Card href="https://example.com/docs" title="An external Card">
    External destinations open in a new tab.
  </Card>
</Cards>

\`\`\`files
src/
  features/
    blog/
      catalog/
        a-considerably-longer-feature-file-name.tsx
package.json
\`\`\`

<Steps>
<Step title="Install">
Press <Kbd>Enter</Kbd> and wait.
</Step>
<Step title="Verify">
Steps hold ordinary Article content.
</Step>
</Steps>

<Tabs>
<Tab title="First">

<Accordion>
<AccordionItem title="Closed by default">

### A heading inside two panels

</AccordionItem>
</Accordion>

</Tab>
<Tab title="Second">A single sentence, with no element child at all.</Tab>
</Tabs>
`;

const renderArticle = (
  compiled: MDXContent,
  status: "draft" | "published"
): string => {
  const Content: MDXContent = () =>
    createElement(compiled, { components: getArticleMdxComponents() });

  const article = {
    Content,
    cover: { height: 630, src: "/cover.png", width: 1200 },
    description: "A representative Article.",
    discovery: null,
    href: "/blog/representative-article",
    navigation: { next: null, previous: null },
    outline: [],
    publishedAt: status === "published" ? "2026-08-02" : null,
    slug: "representative-article",
    status,
    tags: [],
    title: "Representative Article",
    updatedAt: null,
  } as unknown as ArticleDetail;

  return renderToStaticMarkup(
    <ArticleView
      article={article}
      canonicalUrl={
        status === "published"
          ? "https://levin.baenninger.me/blog/representative-article"
          : null
      }
    />
  );
};

const compileArticle = async (source: string): Promise<MDXContent> => {
  const compiled = await evaluate(
    {
      path: "src/features/blog/articles/example/example.mdx",
      value: source,
    },
    {
      ...runtime,
      ...(await loadArticleMdxProcessorOptions(CODE_THEMES)),
      baseUrl: import.meta.url,
    }
  );
  return compiled.default;
};

describe("Article presentation language", () => {
  let published = "";
  let draft = "";
  let rich = "";

  beforeAll(async () => {
    const compiled = await compileArticle(REPRESENTATIVE_ARTICLE);
    published = renderArticle(compiled, "published");
    draft = renderArticle(compiled, "draft");
    rich = renderArticle(await compileArticle(RICH_ARTICLE), "published");
  });

  test("scopes the presentation to the Article body", () => {
    expect(published).toContain('data-slot="article-body"');
    expect(published).toContain('class="typeset"');
  });

  test("makes every body heading its own fragment link", () => {
    for (const [tag, id] of [
      ["h2", "reading-an-article"],
      ["h3", "the-second-section"],
      ["h4", "a-depth-four-heading"],
    ] as const) {
      expect(published).toContain(`<${tag} id="${id}">`);
      expect(published).toContain(
        `<a data-article-heading-anchor="" href="#${id}">`
      );
    }
  });

  test("offers section copying on a Published Article only", () => {
    expect(published).toContain('aria-label="Copy link to section"');
    expect(draft).not.toContain('aria-label="Copy link to section"');
    // Drafts keep fragment links; only the public copy action is withheld.
    expect(draft).toContain('href="#the-second-section"');
  });

  test("marks external destinations for sighted and assistive readers alike", () => {
    expect(published).toContain(
      '<a href="https://example.com/reference" rel="noopener noreferrer" target="_blank">'
    );
    expect(published).toContain("(opens in a new tab)");
    expect(published).toContain("data-article-external-mark");
    // Fragment and in-app paths are not external.
    expect(published.match(/opens in a new tab/gu)).toHaveLength(1);
    expect(published).toContain('href="#the-second-section"');
    expect(published).toContain('href="/blog"');
  });

  test("puts a table in a named keyboard-reachable scroll region", () => {
    expect(published).toMatch(
      /<section(?=[^>]*aria-label="Table")(?=[^>]*tabindex="0")[^>]*>\s*<table/u
    );
  });

  test("gives a Callout kind three channels, only one of which is colour", () => {
    expect(rich).toContain('<aside data-kind="note"');
    expect(rich).toContain('<aside data-kind="danger"');
    // Callout is aside, not Alert: static prose must not be a live region.
    expect(rich).not.toContain('role="alert"');
    expect(rich).toContain('<span class="sr-only">Note: </span>');
    expect(rich).toContain('<span class="sr-only">Danger: </span>');
    expect(rich).toMatch(
      /<svg(?=[^>]*aria-hidden="true")[^>]*data-slot="article-callout-mark"/u
    );
  });

  test("renders a Card collection as a list with one link per linked Card", () => {
    expect(rich).toContain('<ul data-slot="article-cards">');
    expect(rich.match(/<li data-slot="article-card">/gu)).toHaveLength(3);
    // Count the tile's own anchor: the third Card carries an ordinary authored link in its body.
    expect(rich).toMatch(
      /<li data-slot="article-card"><a href="\/blog\/deploy"/u
    );
    expect(rich).toMatch(
      /<li data-slot="article-card"><a href="https:\/\/example\.com\/docs"/u
    );
    expect(rich).toMatch(/<li data-slot="article-card"><div data-slot="card"/u);
  });

  // A `files` fence compiles every Folder closed, so server output is the top level.
  test("renders a file tree's top level with an operable Folder control", () => {
    expect(rich).toContain('<ul data-slot="article-files">');
    expect(rich).toContain('aria-label="src folder"');
    expect(rich).toContain('aria-expanded="false"');
    expect(rich).toContain('data-file-kind="json"');
    expect(rich).toMatch(
      /<li data-file-kind="json" data-slot="article-file">/u
    );
  });

  test("numbers Steps without adding them to the Article outline", () => {
    expect(rich).toContain('<ol data-slot="article-steps">');
    expect(rich).toContain('<div data-slot="article-step-title">Install</div>');
    expect(rich).toContain("<kbd");
    expect([...rich.matchAll(/<h[1-6][\s>]/gu)]).toHaveLength(3);
  });

  test("server-renders both panel models populated and labelled", () => {
    expect(rich).toContain('data-slot="article-tabs"');
    expect(rich).toContain('data-slot="article-accordion"');
    expect(rich).toContain('role="tablist"');
    expect(rich.match(/role="tab"/gu)).toHaveLength(2);
    // A heading inside a closed Accordion inside an unselected Tab stays in
    // the server output so the outline is stable.
    expect(rich).toContain('id="a-heading-inside-two-panels"');
    expect(rich).toContain('hidden="until-found"');
    // Accordion.Header would emit h3 into the outline.
    expect(rich).not.toMatch(/<h[1-6][^>]*>Closed by default/u);
  });

  test("names a CodeBlock and keeps its copied source clean", () => {
    expect(published).toContain(
      'aria-label="reader.ts, TypeScript code example"'
    );
    expect(published).toContain('data-line-numbers-start="1"');
    expect(published).toContain('aria-label="Copy code"');
    // Gutter is a CSS counter, never text, so a line number cannot reach the clipboard.
    expect(published).not.toContain(">1</span>");
    expect(published).not.toContain("[!code");
  });

  test("says what an annotation means without relying on its colour", () => {
    expect(published).toContain(
      'class="sr-only" data-code-annotation="">Highlighted line: <'
    );
    expect(published).toContain(
      'class="sr-only" data-code-annotation="">Removed line: <'
    );
  });

  test("renders ordinary Markdown as ordinary semantic prose", () => {
    expect(published).toContain("<ul>");
    expect(published).toContain("<ol>");
    expect(published).toContain('class="contains-task-list"');
    expect(published).toContain('type="checkbox"');
    expect(published).toContain("<blockquote>");
    expect(published).toContain("<hr");
    expect(published).toContain("<code>inlineCode</code>");
  });
});
