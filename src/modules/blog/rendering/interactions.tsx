"use client";

import {
  Accordion as AccordionPrimitive,
  Tabs as TabsPrimitive,
} from "radix-ui";
import { isValidElement, useEffect, useId, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";

interface ArticleAccordionItemProps {
  readonly children?: ReactNode;
  readonly defaultOpen?: boolean;
  readonly title: string;
}

interface ArticleTabProps {
  readonly children?: ReactNode;
  readonly icon?: ReactElement;
  readonly title: string;
}

const flattenChildren = (children: ReactNode): ReactNode[] => {
  if (
    children === null ||
    children === undefined ||
    typeof children === "boolean"
  ) {
    return [];
  }

  if (Array.isArray(children)) {
    return children.flatMap((child: ReactNode) => flattenChildren(child));
  }

  return [children];
};

let hashNavigationConsumers = 0;
let removeHashNavigationListener: (() => void) | undefined;
let hashRevealScheduled = false;

const revealCurrentArticleHash = (): void => {
  if (window.location.hash.length <= 1) {
    return;
  }

  let id: string;
  try {
    id = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return;
  }

  // IDs are generated from authored headings and are not safe CSS selectors.
  // eslint-disable-next-line unicorn/prefer-query-selector
  const target = document.getElementById(id);
  if (target === null) {
    return;
  }

  const panels: HTMLElement[] = [];
  let ancestor = target.parentElement;
  while (ancestor !== null) {
    if (Object.hasOwn(ancestor.dataset, "articlePanel")) {
      panels.unshift(ancestor);
    }
    ancestor = ancestor.parentElement;
  }

  for (const panel of panels) {
    if (panel.hidden === false) {
      continue;
    }
    const controlId = panel.getAttribute("aria-labelledby");
    if (controlId !== null) {
      // Radix-generated IDs may also contain CSS selector punctuation.
      // eslint-disable-next-line unicorn/prefer-query-selector
      const control = document.getElementById(controlId);
      if (control instanceof HTMLElement) {
        control.dispatchEvent(
          new MouseEvent("mousedown", {
            bubbles: true,
            button: 0,
          })
        );
        control.click();
      }
    }
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      target.scrollIntoView();
    });
  });
};

const scheduleArticleHashReveal = (): void => {
  if (hashRevealScheduled) {
    return;
  }
  hashRevealScheduled = true;
  queueMicrotask(() => {
    hashRevealScheduled = false;
    revealCurrentArticleHash();
  });
};

const useArticleHashNavigation = (): void => {
  useEffect(() => {
    hashNavigationConsumers += 1;
    if (hashNavigationConsumers === 1) {
      const handleHashChange = (): void => {
        scheduleArticleHashReveal();
      };
      window.addEventListener("hashchange", handleHashChange);
      removeHashNavigationListener = () => {
        window.removeEventListener("hashchange", handleHashChange);
      };
      scheduleArticleHashReveal();
    }

    return () => {
      hashNavigationConsumers -= 1;
      if (hashNavigationConsumers === 0) {
        removeHashNavigationListener?.();
        removeHashNavigationListener = undefined;
      }
    };
  }, []);
};

export const ArticleAccordionItem = (_props: ArticleAccordionItemProps): null =>
  null;

export const ArticleAccordion = ({
  children,
}: {
  readonly children: ReactNode;
}) => {
  useArticleHashNavigation();
  const baseId = useId();
  const items = flattenChildren(children).filter(
    (child): child is ReactElement<ArticleAccordionItemProps> =>
      isValidElement<ArticleAccordionItemProps>(child) &&
      child.type === ArticleAccordionItem
  );
  const itemValues = useMemo(
    () => items.map((_, index) => `${baseId}-item-${index}`),
    [baseId, items]
  );
  const defaultValues = items.flatMap((item, index) =>
    item.props.defaultOpen === true ? [itemValues[index] ?? ""] : []
  );
  const [openValues, setOpenValues] = useState(defaultValues);

  return (
    <AccordionPrimitive.Root
      onValueChange={setOpenValues}
      type="multiple"
      value={openValues}
    >
      {items.map((item, index) => {
        const value = itemValues[index] ?? "";
        return (
          <AccordionPrimitive.Item key={value} value={value}>
            <AccordionPrimitive.Header>
              <AccordionPrimitive.Trigger data-article-accordion-trigger>
                {item.props.title}
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content
              data-article-panel="accordion"
              forceMount
              hidden={!openValues.includes(value)}
            >
              {item.props.children}
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        );
      })}
    </AccordionPrimitive.Root>
  );
};

export const ArticleTab = (_props: ArticleTabProps): null => null;

export const ArticleTabs = ({ children }: { readonly children: ReactNode }) => {
  useArticleHashNavigation();
  const baseId = useId();
  const tabs = flattenChildren(children).filter(
    (child): child is ReactElement<ArticleTabProps> =>
      isValidElement<ArticleTabProps>(child) && child.type === ArticleTab
  );
  const values = useMemo(
    () => tabs.map((_, index) => `${baseId}-tab-${index}`),
    [baseId, tabs]
  );
  const firstValue = values[0] ?? "";
  const [selectedValue, setSelectedValue] = useState(firstValue);

  return (
    <TabsPrimitive.Root onValueChange={setSelectedValue} value={selectedValue}>
      <TabsPrimitive.List>
        {tabs.map((tab, index) => {
          const value = values[index] ?? "";
          return (
            <TabsPrimitive.Trigger key={value} value={value}>
              {tab.props.icon}
              <span>{tab.props.title}</span>
            </TabsPrimitive.Trigger>
          );
        })}
      </TabsPrimitive.List>
      {tabs.map((tab, index) => {
        const value = values[index] ?? "";
        return (
          <TabsPrimitive.Content
            data-article-panel="tab"
            forceMount
            hidden={selectedValue !== value}
            key={value}
            value={value}
          >
            {tab.props.children}
          </TabsPrimitive.Content>
        );
      })}
    </TabsPrimitive.Root>
  );
};
