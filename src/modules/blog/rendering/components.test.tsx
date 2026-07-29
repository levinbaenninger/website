import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";

import {
  matchSynchronizedCodeTab,
  readCodeTabPreference,
  writeCodeTabPreference,
} from "./code-tabs";
import {
  ArticleCallout,
  ArticleCard,
  ArticleCards,
  ArticleCodeBlock,
  ArticleFile,
  ArticleFiles,
  ArticleFolder,
  ArticleFigure,
  ArticleKbd,
  ArticleLink,
  ArticleStep,
  ArticleSteps,
  ArticleTaskInput,
} from "./components";
import {
  ArticleAccordion,
  ArticleAccordionItem,
  ArticleTab,
  ArticleTabs,
} from "./interactions";
import { getArticleMdxComponents } from "./mdx-components";

describe("semantic Article components", () => {
  test("owns every approved semantic Markdown mapping", () => {
    const registry = getArticleMdxComponents();

    expect(Object.isFrozen(registry)).toBe(true);
    expect(Object.keys(registry).toSorted()).toEqual([
      "Accordion",
      "AccordionItem",
      "Callout",
      "Card",
      "Cards",
      "CodeTabs",
      "Figure",
      "File",
      "Files",
      "Folder",
      "Kbd",
      "Step",
      "Steps",
      "Tab",
      "Tabs",
      "a",
      "blockquote",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "hr",
      "input",
      "pre",
      "table",
      "tbody",
      "td",
      "th",
      "thead",
      "tr",
    ]);
  });

  test("renders links with destination-specific browser behavior", () => {
    const internal = renderToStaticMarkup(
      <ArticleLink href="/blog/another#details">Internal</ArticleLink>
    );
    const external = renderToStaticMarkup(
      <ArticleLink href="https://example.com/docs">External</ArticleLink>
    );

    expect(internal).toBe('<a href="/blog/another#details">Internal</a>');
    expect(external).toBe(
      '<a href="https://example.com/docs" rel="noopener noreferrer" target="_blank">External</a>'
    );
  });

  test("preserves intrinsic image data and explicit alternatives", () => {
    const informative = renderToStaticMarkup(
      <ArticleFigure
        alt="Request flow"
        src={{ height: 360, src: "/diagram.png", width: 640 }}
      >
        Diagram caption
      </ArticleFigure>
    );
    const decorative = renderToStaticMarkup(
      <ArticleFigure
        decorative
        src={{ height: 100, src: "/decoration.svg", width: 200 }}
      />
    );

    expect(informative).toContain("<figure>");
    expect(informative).toContain('<img alt="Request flow"');
    expect(informative).toContain('width="640" height="360"');
    expect(informative).toContain("<figcaption>Diagram caption</figcaption>");
    expect(decorative).toContain('<img alt=""');
    expect(decorative).toContain('width="200" height="100"');
  });

  test("renders GFM task controls as native disabled checkboxes", () => {
    const input = renderToStaticMarkup(<ArticleTaskInput checked readOnly />);

    expect(input).toBe(
      '<input readOnly="" disabled="" type="checkbox" checked=""/>'
    );
  });

  test("renders callouts and cards as semantic static server output", () => {
    const callout = renderToStaticMarkup(
      <ArticleCallout kind="warning" title="Careful">
        Static guidance
      </ArticleCallout>
    );
    const cards = renderToStaticMarkup(
      <ArticleCards>
        <ArticleCard href="/blog/deploy" title="Deploy">
          One destination
        </ArticleCard>
        <ArticleCard title="Inspect">Static content</ArticleCard>
      </ArticleCards>
    );

    expect(callout).toContain("<aside");
    expect(callout).toContain('data-kind="warning"');
    expect(callout).not.toContain('role="alert"');
    expect(cards).toContain('<a href="/blog/deploy"');
    expect(cards.match(/href="\/blog\/deploy"/gu)).toHaveLength(1);
    expect(cards).toContain('<article data-slot="article-card"');
  });

  test("preserves file-tree, ordered-step, and keyboard semantics", () => {
    const output = renderToStaticMarkup(
      <>
        <ArticleFiles>
          <ArticleFolder defaultOpen name="app">
            <ArticleFile name="page.tsx" />
          </ArticleFolder>
        </ArticleFiles>
        <ArticleSteps>
          <ArticleStep title="Run">
            Press <ArticleKbd>Enter</ArticleKbd>
          </ArticleStep>
        </ArticleSteps>
      </>
    );

    expect(output).toContain('<ul data-slot="article-files"');
    expect(output).toContain('data-slot="collapsible"');
    expect(output).toContain('aria-label="app folder"');
    expect(output).toContain('data-file-kind="tsx"');
    expect(output).toContain('<ol data-slot="article-steps"');
    expect(output).toContain('<li data-slot="article-step"');
    expect(output).toContain("<kbd");
  });

  test("server-renders every interactive panel while preserving defaults", () => {
    const markup = renderToStaticMarkup(
      <ArticleTabs>
        <ArticleTab title="First">
          <h2 id="visible-heading">Visible heading</h2>
        </ArticleTab>
        <ArticleTab title="Second">
          <ArticleAccordion>
            <ArticleAccordionItem title="Closed">
              <h2 id="hidden-heading">Hidden heading</h2>
            </ArticleAccordionItem>
          </ArticleAccordion>
        </ArticleTab>
      </ArticleTabs>
    );

    expect(markup).toContain('id="visible-heading"');
    expect(markup).toContain('id="hidden-heading"');
    expect(markup).toMatch(
      /role="tabpanel"[^>]*hidden=""[^>]*data-article-panel="tab"/u
    );
    expect(markup).toMatch(
      /hidden=""[^>]*role="region"[^>]*data-article-panel="accordion"/u
    );
  });

  test("renders clean code copy controls and line-number metadata", () => {
    const markup = renderToStaticMarkup(
      <ArticleCodeBlock
        data-code-title="Example"
        data-copy-source={"const answer = 42\n"}
        data-line-numbers-start={3}
      >
        <code>highlighted output</code>
      </ArticleCodeBlock>
    );

    expect(markup).toContain('data-line-numbers-start="3"');
    expect(markup).toContain("<span>Example</span>");
    expect(markup).toContain('aria-label="Copy code"');
    expect(markup).toContain("<code>highlighted output</code>");
  });

  test("uses Blog-namespaced code-tab preferences with safe fallback", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };

    writeCodeTabPreference(storage, "runtime", "TypeScript");
    expect(values.get("blog:code-tabs:runtime")).toBe("TypeScript");
    expect(
      readCodeTabPreference(storage, "runtime", ["JavaScript", "TypeScript"])
    ).toBe("TypeScript");
    expect(
      readCodeTabPreference(storage, "runtime", ["Shell"])
    ).toBeUndefined();
    expect(
      matchSynchronizedCodeTab("runtime", ["JavaScript", "TypeScript"], {
        groupId: "runtime",
        label: "TypeScript",
      })
    ).toBe("TypeScript");
    expect(
      matchSynchronizedCodeTab("runtime", ["JavaScript"], {
        groupId: "runtime",
        label: "TypeScript",
      })
    ).toBeUndefined();
    expect(
      matchSynchronizedCodeTab(undefined, ["TypeScript"], {
        groupId: "runtime",
        label: "TypeScript",
      })
    ).toBeUndefined();

    const unavailable = {
      getItem: () => {
        throw new Error("Storage denied");
      },
      setItem: () => {
        throw new Error("Storage denied");
      },
    };
    expect(
      readCodeTabPreference(unavailable, "runtime", ["TypeScript"])
    ).toBeUndefined();
    expect(() => {
      writeCodeTabPreference(unavailable, "runtime", "TypeScript");
    }).not.toThrow();
  });
});
