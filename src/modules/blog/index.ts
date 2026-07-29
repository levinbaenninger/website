import type { MDXComponents } from "mdx/types";

import {
  ArticleFigure,
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
import {
  ArticleAccordion,
  ArticleAccordionItem,
  ArticleTab,
  ArticleTabs,
} from "./article-interactions";

const articleMdxComponents: MDXComponents = {
  Accordion: ArticleAccordion,
  AccordionItem: ArticleAccordionItem,
  Figure: ArticleFigure,
  Tab: ArticleTab,
  Tabs: ArticleTabs,
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
};

export const getArticleMdxComponents = (): MDXComponents =>
  articleMdxComponents;

export { BlogView } from "./view";
