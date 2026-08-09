import type { MDXComponents } from "mdx/types";

import { getArticleMdxComponents } from "@/features/blog/rendering/mdx-components";

export const useMDXComponents = (): MDXComponents => getArticleMdxComponents();
