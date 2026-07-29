import { fileURLToPath } from "node:url";

import type { ArticleCodeThemes } from "./code-theme-contract.mts";

const articleContractPlugin = fileURLToPath(
  new URL("contract.mts", import.meta.url)
);
const articleCodePlugin = fileURLToPath(new URL("code.mts", import.meta.url));

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
