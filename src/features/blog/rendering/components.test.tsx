import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";

import {
  matchSynchronizedCodeTab,
  readCodeTabPreference,
  writeCodeTabPreference,
} from "./code/code-tabs";
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

const ServerTabSlot = (props: ComponentProps<typeof ArticleTab>) => (
  <ArticleTab {...props} />
);

const ServerAccordionSlot = (
  props: ComponentProps<typeof ArticleAccordionItem>
) => <ArticleAccordionItem {...props} />;

describe("semantic Article components", () => {
  test("owns every approved semantic Markdown mapping", () => {
    const registry = getArticleMdxComponents();

    expect(Object.isFrozen(registry)).toBeTruthy();
    expect(Object.keys(registry).toSorted()).toStrictEqual([
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
      "hr",
      "input",
      "pre",
      "table",
      "tbody",
      "td",
      "th",
      "thead",
      "tr",
      "twoslash-hover",
      "twoslash-popup",
      "twoslash-trigger",
    ]);
  });

  test("renders links with destination-specific browser behavior", () => {
    const fragment = renderToStaticMarkup(
      <ArticleLink href="#details">Fragment</ArticleLink>
    );
    const internal = renderToStaticMarkup(
      <ArticleLink href="/blog/another#details">Internal</ArticleLink>
    );
    const external = renderToStaticMarkup(
      <ArticleLink href="https://example.com/docs">External</ArticleLink>
    );

    expect(fragment).toBe('<a href="#details">Fragment</a>');
    expect(internal).toContain('href="/blog/another#details"');
    expect(internal).not.toContain("target=");
    expect(external).toContain('rel="noopener noreferrer" target="_blank"');
    expect(external).toContain("(opens in a new tab)");
    expect(external).toContain("data-article-external-mark");
    expect(fragment).not.toContain("(opens in a new tab)");
    expect(internal).not.toContain("(opens in a new tab)");
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

    expect(informative).toContain('<figure data-slot="article-figure">');
    expect(informative).toContain('<img alt="Request flow"');
    expect(informative).toContain('width="640" height="360"');
    expect(informative).toContain("<figcaption>Diagram caption</figcaption>");
    expect(decorative).toContain('<img alt=""');
    expect(decorative).toContain('width="200" height="100"');
    expect(informative).toContain('sizes="(min-width: 48rem) 48rem, 100vw"');
    expect(informative).toContain("srcSet=");
    expect(decorative).toContain('src="/decoration.svg"');
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
    const untitled = renderToStaticMarkup(
      <ArticleCallout kind="danger">Static guidance</ArticleCallout>
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
    expect(callout).toContain('data-slot="article-callout-mark"');
    expect(callout).toContain('<span class="sr-only">Warning: </span>');
    expect(untitled).toContain('<span class="sr-only">Danger: </span>');
    expect(untitled).not.toContain('data-slot="alert-title"');

    expect(cards).toContain('<ul data-slot="article-cards">');
    expect(cards.match(/<li data-slot="article-card">/gu)).toHaveLength(2);
    expect(cards).toContain('<a href="/blog/deploy"');
    expect(cards.match(/<a(?:\s|>)/gu)).toHaveLength(1);
    expect(cards).not.toContain("<article");
  });

  test("preserves file-tree, ordered-step, and keyboard semantics", () => {
    const output = renderToStaticMarkup(
      <>
        <ArticleFiles>
          <ArticleFolder defaultOpen name="app">
            <ArticleFolder defaultOpen name="(marketing)">
              <ArticleFile name="a-considerably-longer-route-name.tsx" />
            </ArticleFolder>
            <ArticleFile name="page.tsx" />
            <ArticleFile name="tsconfig.json" />
            <ArticleFile name="README" />
          </ArticleFolder>
        </ArticleFiles>
        <ArticleSteps>
          <ArticleStep title="Run">
            Press <ArticleKbd>Enter</ArticleKbd>
          </ArticleStep>
        </ArticleSteps>
      </>
    );

    expect(output).toContain('<ul data-slot="article-files">');
    expect(output).toContain('aria-label="app folder"');
    expect(output).toContain('aria-label="(marketing) folder"');
    expect(output.match(/data-slot="article-folder-entries"/gu)).toHaveLength(
      2
    );
    expect(output).toContain("a-considerably-longer-route-name.tsx");
    expect(output).toContain('data-file-kind="tsx"');
    expect(output).toContain('data-file-kind="json"');
    expect(output).toContain('data-file-kind="file"');
    expect(output.match(/<svg[^>]*aria-hidden="true"/gu)).not.toBeNull();
    expect(output).toContain('<ol data-slot="article-steps">');
    expect(output).toContain("<kbd");
    expect(output).toContain('<div data-slot="article-step-title">Run</div>');
    expect(output).not.toMatch(/<h[1-6]/u);
  });

  test("server-renders opaque active and inactive panel slots", () => {
    const markup = renderToStaticMarkup(
      <ArticleTabs panels='[{"label":"First","value":"tab-0"},{"label":"Second","value":"tab-1"}]'>
        <ServerTabSlot value="tab-0">
          <h2 id="visible-heading">Visible heading</h2>
        </ServerTabSlot>
        <ServerTabSlot value="tab-1">
          <ArticleAccordion panels='[{"label":"Closed","value":"accordion-item-0","defaultOpen":false}]'>
            <ServerAccordionSlot value="accordion-item-0">
              <h2 id="hidden-heading">Hidden heading</h2>
            </ServerAccordionSlot>
          </ArticleAccordion>
        </ServerTabSlot>
      </ArticleTabs>
    );

    expect(markup).toContain('id="visible-heading"');
    expect(markup).toContain('id="hidden-heading"');
    expect(markup).toMatch(
      /<article-panel(?=[^>]*role="tabpanel")(?=[^>]*hidden="until-found")(?=[^>]*data-article-panel="tab")[^>]*>/u
    );
    expect(markup).toMatch(
      /<article-panel(?=[^>]*role="region")(?=[^>]*hidden="until-found")(?=[^>]*data-article-panel="accordion")[^>]*>/u
    );
    expect(markup).not.toMatch(/<h[1-6][^>]*>Closed/u);
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
