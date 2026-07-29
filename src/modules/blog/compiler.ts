import { fileURLToPath } from "node:url";

const articleContractPlugin = fileURLToPath(
  new URL("article-contract.mts", import.meta.url)
);
const articleCodePlugin = fileURLToPath(
  new URL("article-code.mts", import.meta.url)
);

export interface ArticleCodeThemes {
  readonly dark: "github-dark";
  readonly light: "github-light";
}

export const createArticleMdxOptions = (themes: ArticleCodeThemes) => ({
  rehypePlugins: [
    [articleCodePlugin, { themes }] satisfies [
      string,
      { themes: ArticleCodeThemes },
    ],
  ],
  remarkPlugins: [
    "remark-frontmatter",
    "remark-mdx-frontmatter",
    "remark-gfm",
    articleContractPlugin,
  ],
});
