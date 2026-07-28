import createMDX from "@next/mdx";
import type { NextConfig } from "next";

import { articleMdxOptions } from "./src/modules/blog/compiler";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  reactCompiler: true,
};

const withMDX = createMDX({
  options: articleMdxOptions,
});

export default withMDX(nextConfig);
