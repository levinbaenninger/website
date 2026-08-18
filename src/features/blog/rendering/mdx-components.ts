import type { MDXComponents } from "mdx/types";

import { ArticleCodeTabs } from "./code/code-tabs";
import {
  ArticleTwoslashHover,
  ArticleTwoslashPopup,
  ArticleTwoslashTrigger,
} from "./code/twoslash";
import {
  ArticleCallout,
  ArticleCard,
  ArticleCards,
  ArticleFile,
  ArticleFiles,
  ArticleFolder,
  ArticleFigure,
  ArticleCodeBlock,
  ArticleHeading2,
  ArticleHeading3,
  ArticleHeading4,
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
} from "./components";
import {
  ArticleAccordion,
  ArticleAccordionItem,
  ArticleTab,
  ArticleTabs,
} from "./interactions";

const articleMdxComponents: MDXComponents = Object.freeze({
  Accordion: ArticleAccordion,
  AccordionItem: ArticleAccordionItem,
  Callout: ArticleCallout,
  Card: ArticleCard,
  Cards: ArticleCards,
  CodeTabs: ArticleCodeTabs,
  File: ArticleFile,
  Files: ArticleFiles,
  Folder: ArticleFolder,
  Figure: ArticleFigure,
  Kbd: ArticleKbd,
  Step: ArticleStep,
  Steps: ArticleSteps,
  Tab: ArticleTab,
  Tabs: ArticleTabs,
  a: ArticleLink,
  blockquote: ArticleQuote,
  h2: ArticleHeading2,
  h3: ArticleHeading3,
  h4: ArticleHeading4,
  hr: ArticleThematicBreak,
  input: ArticleTaskInput,
  pre: ArticleCodeBlock,
  table: ArticleTable,
  tbody: ArticleTableBody,
  td: ArticleTableCell,
  th: ArticleTableHeading,
  thead: ArticleTableHead,
  tr: ArticleTableRow,
  // Hyphenated twoslash tags are unreachable from authored MDX.
  "twoslash-hover": ArticleTwoslashHover,
  "twoslash-popup": ArticleTwoslashPopup,
  "twoslash-trigger": ArticleTwoslashTrigger,
});

export const getArticleMdxComponents = (): MDXComponents =>
  articleMdxComponents;
