import type { MDXComponents } from "mdx/types";

import {
  ArticleFigure,
  ArticleLink,
  ArticleTaskInput,
} from "./article-components";

const articleMdxComponents: MDXComponents = {
  Figure: ArticleFigure,
  a: ArticleLink,
  input: ArticleTaskInput,
};

export const getArticleMdxComponents = (): MDXComponents =>
  articleMdxComponents;

export { BlogView } from "./view";
