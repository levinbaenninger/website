import type { MDXComponents } from "mdx/types";

import { ArticleCodeTabs } from "./code-tabs";
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
import {
  ArticleTwoslashHover,
  ArticleTwoslashPopup,
  ArticleTwoslashTrigger,
} from "./twoslash";

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
  /*
   * Twoslash's own hover markup, lifted by `code.ts` into three named elements
   * the registry can reach. A hyphenated tag name is a component key like any
   * other, and using one keeps these three unreachable from authored MDX: the
   * closed language rejects raw HTML and every unknown component name, so an
   * author can no more write `<twoslash-hover>` than they can write a `div`.
   */
  "twoslash-hover": ArticleTwoslashHover,
  "twoslash-popup": ArticleTwoslashPopup,
  "twoslash-trigger": ArticleTwoslashTrigger,
});

export const getArticleMdxComponents = (): MDXComponents =>
  articleMdxComponents;
