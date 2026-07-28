import type { MDXComponents } from "mdx/types";

import { getArticleMdxComponents } from "@/modules/blog";

export const useMDXComponents = (): MDXComponents => getArticleMdxComponents();
