import type { MDXComponents } from "mdx/types";

import {
  ArticleFigure,
  ArticleCodeBlock,
  ArticleCodeTabs,
  ArticleHeading2,
  ArticleHeading3,
  ArticleHeading4,
  ArticleHeading5,
  ArticleHeading6,
  ArticleLink,
  ArticleQuote,
  ArticleTable,
  ArticleTableBody,
  ArticleTableCell,
  ArticleTableHead,
  ArticleTableHeading,
  ArticleTableRow,
  ArticleTaskInput,
  ArticleThematicBreak,
} from "./article-components";

const articleMdxComponents: MDXComponents = {
  CodeTabs: ArticleCodeTabs,
  Figure: ArticleFigure,
  a: ArticleLink,
  blockquote: ArticleQuote,
  h2: ArticleHeading2,
  h3: ArticleHeading3,
  h4: ArticleHeading4,
  h5: ArticleHeading5,
  h6: ArticleHeading6,
  hr: ArticleThematicBreak,
  input: ArticleTaskInput,
  pre: ArticleCodeBlock,
  table: ArticleTable,
  tbody: ArticleTableBody,
  td: ArticleTableCell,
  th: ArticleTableHeading,
  thead: ArticleTableHead,
  tr: ArticleTableRow,
};

export const getArticleMdxComponents = (): MDXComponents =>
  articleMdxComponents;

export { BlogView } from "./view";
