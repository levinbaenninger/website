import { evaluate } from "@mdx-js/mdx";
import { within } from "@testing-library/react";
import { Window } from "happy-dom";
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

const testDocument = new Window().document;

/*
 * Compiled in-memory rather than under content/: an Article there would move
 * the manifest, catalog, search artifact, sitemap, and social images.
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
): HTMLElement => {
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

  const container = testDocument.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    <ArticleView
      article={article}
      canonicalUrl={
        status === "published"
          ? "https://levin.baenninger.me/blog/representative-article"
          : null
      }
    />
  );
  return container as unknown as HTMLElement;
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
  let published: ReturnType<typeof renderArticle>;
  let draft: ReturnType<typeof renderArticle>;
  let rich: ReturnType<typeof renderArticle>;

  beforeAll(async () => {
    const compiled = await compileArticle(REPRESENTATIVE_ARTICLE);
    published = renderArticle(compiled, "published");
    draft = renderArticle(compiled, "draft");
    rich = renderArticle(await compileArticle(RICH_ARTICLE), "published");
  });

  test("makes every body heading its own fragment link", () => {
    for (const [level, id, name] of [
      [2, "reading-an-article", "Reading an Article"],
      [3, "the-second-section", "The second section"],
      [4, "a-depth-four-heading", "A depth-four heading"],
    ] as const) {
      const heading = within(published).getByRole("heading", { level, name });
      const link = within(heading).getByRole("link", { name });

      expect(heading.id).toBe(id);
      expect(link.getAttribute("href")).toBe(`#${id}`);
    }
  });

  test("offers section copying on a Published Article only", () => {
    expect(
      within(published).getAllByRole("button", {
        name: "Copy link to section",
      })
    ).toHaveLength(3);
    expect(
      within(draft).queryByRole("button", { name: "Copy link to section" })
    ).toBeNull();
    expect(
      within(draft)
        .getByRole("heading", { level: 3, name: "The second section" })
        .querySelector("a")
        ?.getAttribute("href")
    ).toBe("#the-second-section");
  });

  test("marks external destinations for sighted and assistive readers alike", () => {
    const external = within(published).getByRole("link", {
      name: /external destination.*opens in a new tab/u,
    });

    expect(external.getAttribute("href")).toBe("https://example.com/reference");
    expect(external.getAttribute("rel")).toBe("noopener noreferrer");
    expect(external.getAttribute("target")).toBe("_blank");
    expect(
      within(published)
        .getByRole("link", { name: "same-Article fragment" })
        .getAttribute("href")
    ).toBe("#the-second-section");
    expect(
      within(published)
        .getByRole("link", { name: "root-relative destination" })
        .getAttribute("href")
    ).toBe("/blog");
  });

  test("puts a table in a named keyboard-reachable scroll region", () => {
    const region = within(published).getByRole("region", { name: "Table" });

    expect(region.tabIndex).toBe(0);
    expect(within(region).getByRole("table")).toBeTruthy();
  });

  test("gives a Callout kind three channels, only one of which is colour", () => {
    const note = within(rich).getByText("A note").closest("aside");
    const danger = within(rich)
      .getByText(/Danger has no title/u)
      .closest("aside");

    expect(note?.getAttribute("role")).toBeNull();
    expect(note?.textContent).toContain("Note:");
    expect(note?.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    expect(danger?.getAttribute("role")).toBeNull();
    expect(danger?.textContent).toContain("Danger:");
    expect(danger?.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  });

  test("renders a Card collection as a list with one link per linked Card", () => {
    const internal = within(rich).getByRole("link", {
      name: /A linked Card/u,
    });
    const external = within(rich).getByRole("link", {
      name: /An external Card/u,
    });
    const unlinked = within(rich).getByText("An unlinked Card").closest("li");
    const cards = internal.closest("ul");

    expect(cards?.children).toHaveLength(3);
    expect(internal.getAttribute("href")).toBe("/blog/deploy");
    expect(external.getAttribute("href")).toBe("https://example.com/docs");
    expect(unlinked?.querySelector(":scope > a")).toBeNull();
  });

  test("renders a file tree's top level with an operable Folder control", () => {
    const folder = within(rich).getByRole("button", { name: "src folder" });
    const packageFile = within(rich).getByText("package.json").closest("li");

    expect(folder.getAttribute("aria-expanded")).toBe("false");
    expect(packageFile?.dataset.fileKind).toBe("json");
  });

  test("numbers Steps without adding them to the Article outline", () => {
    const install = within(rich).getByText("Install");
    const steps = install.closest("ol");
    const enterKey = install.closest("li")?.querySelector("kbd");

    expect(steps?.children).toHaveLength(2);
    expect(enterKey?.textContent).toBe("Enter");
    expect(rich.querySelectorAll("h1, h2, h3, h4, h5, h6")).toHaveLength(3);
  });

  test("server-renders both panel models populated and labelled", () => {
    const tablist = rich.querySelector('[role="tablist"]');
    const tabs = [...rich.querySelectorAll<HTMLElement>('[role="tab"]')];

    expect(tablist).not.toBeNull();
    expect(tabs.map(({ textContent }) => textContent)).toStrictEqual([
      "First",
      "Second",
    ]);
    const panelHeading = rich.querySelector("h3#a-heading-inside-two-panels");

    expect(panelHeading?.textContent).toContain("A heading inside two panels");
    expect(rich.querySelector('[hidden="until-found"]')).not.toBeNull();
    expect(
      [...rich.querySelectorAll("h1, h2, h3, h4, h5, h6")].some(
        ({ textContent }) => textContent?.includes("Closed by default")
      )
    ).toBeFalsy();
  });

  test("names a CodeBlock and keeps its copied source clean", () => {
    const codeBlock = within(published).getByRole("figure", {
      name: "reader.ts, TypeScript code example",
    });

    expect(codeBlock.dataset.lineNumbersStart).toBe("1");
    expect(
      within(codeBlock).getByRole("button", { name: "Copy code" })
    ).toBeTruthy();
    expect(codeBlock.textContent).not.toContain("[!code");
  });

  test("says what an annotation means without relying on its colour", () => {
    const annotations = [
      ...published.querySelectorAll<HTMLElement>("[data-code-annotation]"),
    ];

    expect(annotations.map(({ textContent }) => textContent)).toContain(
      "Highlighted line: "
    );
    expect(annotations.map(({ textContent }) => textContent)).toContain(
      "Removed line: "
    );
  });

  test("renders ordinary Markdown as ordinary semantic prose", () => {
    expect(published.querySelector("ul")).not.toBeNull();
    expect(published.querySelector("ol")).not.toBeNull();
    expect(
      within(published).getAllByRole("checkbox", { hidden: true })
    ).toHaveLength(2);
    expect(published.querySelector("blockquote")?.textContent.trim()).toBe(
      "A quoted aside."
    );
    expect(published.querySelector("hr")).not.toBeNull();
    expect(within(published).getByText("inlineCode").tagName).toBe("CODE");
  });
});
