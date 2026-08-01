// PROTOTYPE — throwaway. Delete this directory once issue #34 is decided.
//
// A bridge, not a re-implementation. See NOTES finding 1.
//
// `ArticleAccordion` and `ArticleTabs` select their children by reference
// identity (`child.type === ArticleAccordionItem`). That works when the whole
// tree is client code, which is how #33's prototype and `interactions.dom.test`
// exercise them. It does *not* work when the Article is rendered as a server
// component — the production path — because the server sees a client *reference*
// for `AccordionItem`, and a client reference is never `===` the imported
// function the client component compares against. Both panels render empty.
//
// These two components re-create each child with the reference the client module
// actually holds, so the panels below are still the production
// `ArticleAccordion` / `ArticleTabs`, including `forceMount`, `hidden` and the
// `hashchange` reveal. Nothing about panel behaviour is faked; only the
// hand-off is repaired.

"use client";

import { isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";

import {
  ArticleAccordion,
  ArticleAccordionItem,
  ArticleTab,
  ArticleTabs,
} from "@/modules/blog/rendering/interactions";

interface AccordionItemProps {
  readonly children?: ReactNode;
  readonly defaultOpen?: boolean;
  readonly title: string;
}

interface TabProps {
  readonly children?: ReactNode;
  readonly icon?: ReactElement;
  readonly title: string;
}

const flatten = (children: ReactNode): ReactNode[] => {
  if (
    children === null ||
    children === undefined ||
    typeof children === "boolean"
  ) {
    return [];
  }
  if (Array.isArray(children)) {
    return children.flatMap((child: ReactNode) => flatten(child));
  }
  return [children];
};

const elements = <T,>(children: ReactNode): readonly ReactElement<T>[] =>
  flatten(children).filter((child): child is ReactElement<T> =>
    isValidElement<T>(child)
  );

export const PrototypeAccordion = ({
  children,
}: {
  readonly children: ReactNode;
}) => (
  <ArticleAccordion>
    {elements<AccordionItemProps>(children).map((item, index) => (
      <ArticleAccordionItem
        defaultOpen={item.props.defaultOpen}
        key={`${item.props.title}-${index}`}
        title={item.props.title}
      >
        {item.props.children}
      </ArticleAccordionItem>
    ))}
  </ArticleAccordion>
);

export const PrototypeTabs = ({
  children,
}: {
  readonly children: ReactNode;
}) => (
  <ArticleTabs>
    {elements<TabProps>(children).map((tab, index) => (
      <ArticleTab
        icon={tab.props.icon}
        key={`${tab.props.title}-${index}`}
        title={tab.props.title}
      >
        {tab.props.children}
      </ArticleTab>
    ))}
  </ArticleTabs>
);
