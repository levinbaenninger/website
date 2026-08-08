"use client";

import { ChevronDownIcon } from "lucide-react";
import {
  Accordion as AccordionPrimitive,
  Tabs as TabsPrimitive,
} from "radix-ui";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

import {
  parseArticleAccordionPanels,
  parseArticleTabPanels,
} from "./panel-contract.ts";
import type { ArticleAccordionPanel } from "./panel-contract.ts";

interface ArticleAccordionContextValue {
  readonly openValues: readonly string[];
  readonly panels: readonly ArticleAccordionPanel[];
  readonly reveal: (value: string) => void;
}

interface ArticleTabsContextValue {
  readonly reveal: (value: string) => void;
  readonly selectedValue: string;
}

const ArticleAccordionContext = createContext<
  ArticleAccordionContextValue | undefined
>(undefined);
const ArticleTabsContext = createContext<ArticleTabsContextValue | undefined>(
  undefined
);

const useRequiredContext = <T,>(
  context: T | undefined,
  componentName: string
): T => {
  if (context === undefined) {
    throw new Error(
      `${componentName} must be rendered inside its panel group.`
    );
  }
  return context;
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

const useBeforeMatch = (reveal: () => void, hidden: boolean) => {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (panel !== null) {
      panel.addEventListener("beforematch", reveal);
      if (hidden) {
        panel.setAttribute("hidden", "until-found");
      } else {
        panel.removeAttribute("hidden");
      }
    }
    return () => {
      panel?.removeEventListener("beforematch", reveal);
    };
  }, [hidden, reveal]);

  return panelRef;
};

export const ArticleAccordionItem = ({
  children,
  value,
}: {
  readonly children?: ReactNode;
  readonly value: string;
}) => {
  const context = useRequiredContext(
    useContext(ArticleAccordionContext),
    "ArticleAccordionItem"
  );
  const panel = context.panels.find((candidate) => candidate.value === value);
  if (panel === undefined) {
    throw new TypeError(
      `Unknown compiled Accordion value ${JSON.stringify(value)}.`
    );
  }
  const open = context.openValues.includes(value);
  const reveal = () => {
    context.reveal(value);
  };
  const panelRef = useBeforeMatch(reveal, !open);

  return (
    <AccordionPrimitive.Item data-slot="article-accordion-item" value={value}>
      {/*
       * `asChild` replaces Radix's own `h3`: an Accordion label is a component
       * label, not an authored heading, and the Article outline is the set of
       * authored headings. A disclosure with no mark reads as a heading anyway,
       * so the trigger carries a real chevron that `article.css` rotates.
       */}
      <AccordionPrimitive.Header asChild>
        <div data-article-accordion-header data-slot="article-accordion-header">
          <AccordionPrimitive.Trigger
            data-article-accordion-trigger
            data-slot="article-accordion-trigger"
          >
            {panel.label}
            <ChevronDownIcon aria-hidden data-slot="article-disclosure-mark" />
          </AccordionPrimitive.Trigger>
        </div>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content asChild forceMount>
        <article-panel
          data-article-panel="accordion"
          hidden={open ? undefined : "until-found"}
          ref={panelRef}
          style={{ display: "block" }}
        >
          {children}
        </article-panel>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
};

export const ArticleAccordion = ({
  children,
  panels: serializedPanels,
}: {
  readonly children: ReactNode;
  readonly panels: string;
}) => {
  useArticleHashNavigation();
  const panels = useMemo(
    () => parseArticleAccordionPanels(serializedPanels),
    [serializedPanels]
  );
  const [openValues, setOpenValues] = useState(() =>
    panels.flatMap(({ defaultOpen, value }) => (defaultOpen ? [value] : []))
  );
  const context = useMemo<ArticleAccordionContextValue>(
    () => ({
      openValues,
      panels,
      reveal: (value) => {
        setOpenValues((current) =>
          current.includes(value) ? current : [...current, value]
        );
      },
    }),
    [openValues, panels]
  );

  return (
    <ArticleAccordionContext value={context}>
      <AccordionPrimitive.Root
        data-slot="article-accordion"
        onValueChange={setOpenValues}
        type="multiple"
        value={openValues}
      >
        {children}
      </AccordionPrimitive.Root>
    </ArticleAccordionContext>
  );
};

export const ArticleTab = ({
  children,
  value,
}: {
  readonly children?: ReactNode;
  readonly value: string;
}) => {
  const context = useRequiredContext(
    useContext(ArticleTabsContext),
    "ArticleTab"
  );
  const reveal = () => {
    context.reveal(value);
  };
  const panelRef = useBeforeMatch(reveal, context.selectedValue !== value);

  return (
    <TabsPrimitive.Content asChild forceMount value={value}>
      <article-panel
        data-article-panel="tab"
        hidden={context.selectedValue === value ? undefined : "until-found"}
        ref={panelRef}
        style={{ display: "block" }}
      >
        {children}
      </article-panel>
    </TabsPrimitive.Content>
  );
};

export const ArticleTabs = ({
  children,
  panels: serializedPanels,
  ...iconSlots
}: {
  readonly children: ReactNode;
  readonly panels: string;
  readonly [iconSlot: string]: ReactNode;
}) => {
  useArticleHashNavigation();
  const panels = useMemo(
    () => parseArticleTabPanels(serializedPanels),
    [serializedPanels]
  );
  const firstValue = panels[0]?.value ?? "";
  const [selectedValue, setSelectedValue] = useState(firstValue);
  const context = useMemo<ArticleTabsContextValue>(
    () => ({ reveal: setSelectedValue, selectedValue }),
    [selectedValue]
  );

  return (
    <ArticleTabsContext value={context}>
      {/*
       * Every other block in the language owns its own leading margin, and
       * Radix's root renders a bare `div` — so without a slot of its own a Tabs
       * placed directly after an Accordion had no gap at all. Presentation
       * should not have to match on shape.
       */}
      <TabsPrimitive.Root
        activationMode="automatic"
        data-slot="article-tabs"
        onValueChange={setSelectedValue}
        value={selectedValue}
      >
        <TabsPrimitive.List data-slot="article-tab-list">
          {panels.map((panel) => (
            <TabsPrimitive.Trigger
              data-slot="article-tab-trigger"
              key={panel.value}
              value={panel.value}
            >
              {panel.iconSlot === undefined ? null : iconSlots[panel.iconSlot]}
              <span>{panel.label}</span>
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>
        {children}
      </TabsPrimitive.Root>
    </ArticleTabsContext>
  );
};
