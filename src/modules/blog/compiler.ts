import { fileURLToPath } from "node:url";

const articleContractPlugin = fileURLToPath(
  new URL("article-contract.mts", import.meta.url)
);

export const articleMdxOptions = {
  remarkPlugins: [
    "remark-frontmatter",
    "remark-mdx-frontmatter",
    "remark-gfm",
    articleContractPlugin,
  ],
};
