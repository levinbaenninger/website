import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";

import {
  readCodeTabPreference,
  writeCodeTabPreference,
} from "./article-code-tabs";
import {
  ArticleCodeBlock,
  ArticleFigure,
  ArticleLink,
  ArticleTaskInput,
} from "./article-components";
import { getArticleMdxComponents } from "./index";

describe("semantic Article components", () => {
  test("owns every approved semantic Markdown mapping", () => {
    expect(Object.keys(getArticleMdxComponents()).toSorted()).toEqual([
      "CodeTabs",
      "Figure",
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
