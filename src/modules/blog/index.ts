import type { MDXComponents } from "mdx/types";

import {
  ArticleCallout,
  ArticleCard,
  ArticleCards,
  ArticleFile,
  ArticleFiles,
  ArticleFolder,
  ArticleFigure,
  ArticleHeading2,
  ArticleHeading3,
  ArticleHeading4,
  ArticleHeading5,
  ArticleHeading6,
  ArticleLink,
  ArticleKbd,
  ArticleQuote,
  ArticleTable,
  ArticleTableBody,
  ArticleTableCell,
  ArticleTableHead,
  ArticleTableHeading,
  ArticleTableRow,
  ArticleTaskInput,
  ArticleThematicBreak,
  ArticleStep,
  ArticleSteps,
} from "./article-components";

const articleMdxComponents: MDXComponents = Object.freeze({
  Callout: ArticleCallout,
  Card: ArticleCard,
  Cards: ArticleCards,
  File: ArticleFile,
  Files: ArticleFiles,
  Folder: ArticleFolder,
  Figure: ArticleFigure,
  Kbd: ArticleKbd,
  Step: ArticleStep,
  Steps: ArticleSteps,
  a: ArticleLink,
  blockquote: ArticleQuote,
  h2: ArticleHeading2,
  h3: ArticleHeading3,
  h4: ArticleHeading4,
  h5: ArticleHeading5,
  h6: ArticleHeading6,
  hr: ArticleThematicBreak,
  input: ArticleTaskInput,
  table: ArticleTable,
  tbody: ArticleTableBody,
  td: ArticleTableCell,
  th: ArticleTableHeading,
  thead: ArticleTableHead,
  tr: ArticleTableRow,
});

export const getArticleMdxComponents = (): MDXComponents =>
  articleMdxComponents;

export { BlogView } from "./view";
