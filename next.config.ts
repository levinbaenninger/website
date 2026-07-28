import { fileURLToPath } from "node:url";

import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const articleContractPlugin = fileURLToPath(
  new URL("src/modules/blog/article-contract.mts", import.meta.url)
);
const articleCodePlugin = fileURLToPath(
  new URL("src/modules/blog/article-code.mts", import.meta.url)
);

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  reactCompiler: true,
};

const withMDX = createMDX({
  options: {
    rehypePlugins: [articleCodePlugin],
    remarkPlugins: [
      "remark-frontmatter",
      "remark-mdx-frontmatter",
      "remark-gfm",
      articleContractPlugin,
    ],
  },
});

export default withMDX(nextConfig);
