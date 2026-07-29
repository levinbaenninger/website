import createMDX from "@next/mdx";
import type { NextConfig } from "next";

import { createArticleMdxOptions } from "./src/modules/blog/rendering/compiler";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  reactCompiler: true,
};

const articleMdxOptions = createArticleMdxOptions({
  dark: "github-dark",
  light: "github-light",
});

const withMDX = createMDX({
  options: articleMdxOptions,
});

export default withMDX(nextConfig);
