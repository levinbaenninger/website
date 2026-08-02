// PROTOTYPE — throwaway. Delete this directory once issue #33 is decided.
//
// Renders a fixture body. Prose presentation is issue #34's question, so this
// stays deliberately plain: real headings with real ids, real Accordion/Tabs
// panels, and nothing else.

"use client";

import {
  ArticleAccordion,
  ArticleAccordionItem,
  ArticleTab,
  ArticleTabs,
} from "@/modules/blog/rendering/interactions";

import type { ResolvedBlock } from "./fixtures";

const Heading = ({
  depth,
  id,
  text,
}: {
  depth: 2 | 3 | 4;
  id: string;
  text: string;
}) => {
  if (depth === 2) {
    return <h2 id={id}>{text}</h2>;
  }
  if (depth === 3) {
    return <h3 id={id}>{text}</h3>;
  }
  return <h4 id={id}>{text}</h4>;
};

const Blocks = ({ blocks }: { blocks: readonly ResolvedBlock[] }) => (
  <>
    {blocks.map((block, index) => {
      if (block.kind === "heading") {
        return (
          <Heading
            depth={block.depth}
            id={block.id}
            key={block.id}
            text={block.text}
          />
        );
      }

      if (block.kind === "accordion") {
        const panels = block.items.map((item, itemIndex) => ({
          defaultOpen: false,
          label: item.title,
          value: `accordion-item-${itemIndex}`,
        }));
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixture order is stable
          <ArticleAccordion
            key={`accordion-${index}`}
            panels={JSON.stringify(panels)}
          >
            {block.items.map((item, itemIndex) => (
              <ArticleAccordionItem
                key={item.title}
                value={`accordion-item-${itemIndex}`}
              >
                <Blocks blocks={item.blocks} />
              </ArticleAccordionItem>
            ))}
          </ArticleAccordion>
        );
      }

      if (block.kind === "tabs") {
        const panels = block.tabs.map((tab, tabIndex) => ({
          label: tab.title,
          value: `tab-${tabIndex}`,
        }));
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixture order is stable
          <ArticleTabs key={`tabs-${index}`} panels={JSON.stringify(panels)}>
            {block.tabs.map((tab, tabIndex) => (
              <ArticleTab key={tab.title} value={`tab-${tabIndex}`}>
                <Blocks blocks={tab.blocks} />
              </ArticleTab>
            ))}
          </ArticleTabs>
        );
      }

      return (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixture order is stable
        <p key={`paragraph-${index}`}>{block.text}</p>
      );
    })}
  </>
);

// `ArticleAccordion` and `ArticleTabs` ship behaviour without a single class, so
// an unstyled panel reads as loose text. Panel presentation belongs to issue #34;
// this is the minimum needed to see where a panel starts and ends while judging
// the table of contents.
const PANEL_SKIN = [
  "[&_[data-article-accordion-trigger]]:flex [&_[data-article-accordion-trigger]]:w-full [&_[data-article-accordion-trigger]]:items-center [&_[data-article-accordion-trigger]]:justify-between [&_[data-article-accordion-trigger]]:gap-2 [&_[data-article-accordion-trigger]]:border-b [&_[data-article-accordion-trigger]]:border-line [&_[data-article-accordion-trigger]]:py-3 [&_[data-article-accordion-trigger]]:text-left [&_[data-article-accordion-trigger]]:text-[0.9375rem] [&_[data-article-accordion-trigger]]:font-medium",
  "[&_[data-article-accordion-trigger]]:after:text-muted-foreground [&_[data-article-accordion-trigger]]:after:content-['+'] [&_[data-article-accordion-trigger][data-state=open]]:after:content-['–']",
  "[&_[data-article-panel=accordion]]:pl-4",
  "[&_[role=tablist]]:mb-2 [&_[role=tablist]]:flex [&_[role=tablist]]:gap-1 [&_[role=tablist]]:border-b [&_[role=tablist]]:border-line",
  "[&_[role=tab]]:-mb-px [&_[role=tab]]:border-b-2 [&_[role=tab]]:border-transparent [&_[role=tab]]:px-2 [&_[role=tab]]:py-1.5 [&_[role=tab]]:text-sm [&_[role=tab]]:text-muted-foreground [&_[role=tab][data-state=active]]:border-foreground [&_[role=tab][data-state=active]]:text-foreground",
].join(" ");

export const PrototypeArticleBody = ({
  blocks,
}: {
  blocks: readonly ResolvedBlock[];
}) => (
  <div className={PANEL_SKIN}>
    <Blocks blocks={blocks} />
  </div>
);
