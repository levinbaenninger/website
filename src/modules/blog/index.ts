import type { MDXComponents } from "mdx/types";

const articleMdxComponents: MDXComponents = {};

export const getArticleMdxComponents = (): MDXComponents =>
  articleMdxComponents;

export { BlogView } from "./view";
