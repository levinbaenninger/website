import { evaluate } from "@mdx-js/mdx";
import type { MDXContent } from "mdx/types";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as runtime from "react/jsx-runtime";
import { beforeAll, describe, expect, test } from "vite-plus/test";

import type { ArticleDetail } from "@/modules/blog/articles/types.ts";
import { ArticleView } from "@/modules/blog/articles/view.tsx";
import type { ArticleCodeThemes } from "@/modules/blog/rendering/code-theme-contract.ts";
import { loadArticleMdxProcessorOptions } from "@/modules/blog/rendering/compiler.ts";
import { getArticleMdxComponents } from "@/modules/blog/rendering/mdx-components.ts";

const CODE_THEMES: ArticleCodeThemes = {
  dark: "github-dark",
  light: "github-light",
};

/*
 * A representative Article, compiled by the production pipeline rather than
 * hand-written as markup: the heading ids, the GFM task-list classes and the
 * link shapes on screen are the ones a real Article produces. It carries the
 * complete core language once — the depth-two-through-four hierarchy, all three
 * link destinations, lists, task items, a quote, a rule, inline code, and a
 * table wide enough to need its scroll region.
 *
 * It lives here rather than in `content/` on purpose. An Article under
 * `content/` moves the generated manifest, the catalog, the search artifact,
 * the sitemap and the social images, none of which this slice owns.
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
`;

const renderArticle = (
  compiled: MDXContent,
  status: "draft" | "published"
): string => {
  // The app supplies the Article registry through `src/mdx-components.tsx`;
  // outside Next that wiring is the caller's, so it is applied here.
  const Content: MDXContent = () =>
    createElement(compiled, { components: getArticleMdxComponents() });

  const article = {
    Content,
    cover: { height: 630, src: "/cover.png", width: 1200 },
    description: "A representative Article.",
    discovery: null,
    href: "/blog/representative-article",
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

describe("Article presentation language", () => {
  let published = "";
  let draft = "";

  beforeAll(async () => {
    const compiled = await evaluate(
      {
        path: "src/modules/blog/articles/example/example.mdx",
        value: REPRESENTATIVE_ARTICLE,
      },
      {
        ...runtime,
        ...(await loadArticleMdxProcessorOptions(CODE_THEMES)),
        baseUrl: import.meta.url,
      }
    );
    published = renderArticle(compiled.default, "published");
    draft = renderArticle(compiled.default, "draft");
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
    // The Draft keeps its fragment links; only the public action is withheld.
    expect(draft).toContain('href="#the-second-section"');
  });

  test("marks external destinations for sighted and assistive readers alike", () => {
    expect(published).toContain(
      '<a href="https://example.com/reference" rel="noopener noreferrer" target="_blank">'
    );
    expect(published).toContain("(opens in a new tab)");
    expect(published).toContain("data-article-external-mark");
    // A same-Article fragment and a root-relative path are not external.
    expect(published.match(/opens in a new tab/gu)).toHaveLength(1);
    expect(published).toContain('href="#the-second-section"');
    expect(published).toContain('href="/blog"');
  });

  test("puts a table in a named keyboard-reachable scroll region", () => {
    expect(published).toMatch(
      /<section(?=[^>]*aria-label="Table")(?=[^>]*tabindex="0")[^>]*>\s*<table/u
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
