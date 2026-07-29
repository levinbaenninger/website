import { fileURLToPath } from "node:url";

import type { ArticleCodeThemes } from "./code-theme-contract.ts";

const articleContractPlugin = fileURLToPath(
  new URL("contract.ts", import.meta.url)
);
const articleCodePlugin = fileURLToPath(new URL("code.ts", import.meta.url));

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
