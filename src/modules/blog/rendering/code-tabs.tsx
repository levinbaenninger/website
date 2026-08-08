"use client";

// Tabbed code examples.
//
// `CodeTabs` is compiler output, never an authored component: `contract.ts`
// groups a consecutive run of `tab="…"` fences — at the root and, since #53, at
// any depth inside a Step, a Tab or an AccordionItem — into one element whose
// labels arrive already validated, unique and in order. Nothing here decides
// what a tab is; it decides how the reader operates one.
//
// Synchronization is by *label*, not by index. Two groups that both offer
// "npm" and "pnpm" agree even when one lists them in the other order and one
// carries a third; a positional model would have quietly desynchronized them.
// Only an authored `tab-group` participates. An ungrouped run has no shared
// identity to synchronize on and stays independent, which is what lets one
// Article show a `.ts`/`.js` pair and an unrelated pair without linking them.
//
// Storage is an enhancement and never a requirement. A private mode, a denied
// origin or a full quota throws on both read and write, and every one of those
// leaves working tabs that simply do not remember — so the reads and writes are
// wrapped rather than feature-detected, which is the only form that also covers
// a quota failure at write time.
//
// A synchronized change must not move focus. The selected value is controlled,
// and Radix moves focus only for a keyboard interaction with its own strip, so a
// group updating because a *different* group was clicked re-renders in place and
// leaves the reader where they were.

import { Tabs as TabsPrimitive } from "radix-ui";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import { parseCodeTabLabels } from "./code-tabs-contract.ts";
import { useArticleFoundPanel } from "./interactions";

const CODE_TAB_STORAGE_PREFIX = "blog:code-tabs:";
const CODE_TAB_EVENT = "blog:code-tabs-change";

interface PreferenceStorage {
  readonly getItem: (key: string) => string | null;
  readonly setItem: (key: string, value: string) => void;
}

export const readCodeTabPreference = (
  storage: PreferenceStorage,
  groupId: string,
  labels: readonly string[]
): string | undefined => {
  try {
    const saved = storage.getItem(`${CODE_TAB_STORAGE_PREFIX}${groupId}`);
    return saved !== null && labels.includes(saved) ? saved : undefined;
  } catch {
    return undefined;
  }
};

export const writeCodeTabPreference = (
  storage: PreferenceStorage,
  groupId: string,
  label: string
): void => {
  try {
    storage.setItem(`${CODE_TAB_STORAGE_PREFIX}${groupId}`, label);
  } catch {
    // Storage is an enhancement; privacy modes and quotas must not break tabs.
  }
};

interface CodeTabChangeDetail {
  readonly groupId: string;
  readonly label: string;
}

export const matchSynchronizedCodeTab = (
  groupId: string | undefined,
  labels: readonly string[],
  detail: CodeTabChangeDetail
): string | undefined =>
  groupId !== undefined &&
  detail.groupId === groupId &&
  labels.includes(detail.label)
    ? detail.label
    : undefined;

declare global {
  interface WindowEventMap {
    readonly "blog:code-tabs-change": CustomEvent<CodeTabChangeDetail>;
  }
}

interface ArticleCodeTabsContextValue {
  readonly select: (label: string) => void;
  readonly selected: string;
}

const ArticleCodeTabsContext =
  createContext<ArticleCodeTabsContextValue | null>(null);

const useRequiredCodeTabsContext = (): ArticleCodeTabsContextValue => {
  const context = useContext(ArticleCodeTabsContext);
  if (context === null) {
    throw new Error("A code tab panel must be rendered inside its CodeTabs.");
  }
  return context;
};

interface ArticleCodeTabsProps {
  readonly children?: ReactNode;
  readonly groupId?: string;
  readonly labels: string;
}

/*
 * The panels are the compiled fences in their authored order, and the labels are
 * the compiled labels in theirs — one list, one index. Nothing inspects a child:
 * across the server/client boundary a child is an unresolved lazy reference
 * during SSR and an element after hydration, so reading `props.children` renders
 * one tree on the server and a different one on the client. Position is the only
 * fact about a child this module uses, and the compiler guarantees it.
 */
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

/*
 * Every panel stays mounted and the inactive ones are `hidden="until-found"`, so
 * a browser find-in-page can reveal a match inside a tab the reader has not
 * opened — and `beforematch` is how the panel hears about it and selects itself.
 * That is `useArticleFoundPanel`, shared with the Accordion and the general Tabs
 * because it is the same browser limitation each time.
 *
 * `article-panel` is the custom element the Accordion and Tabs already use, so
 * the fragment reveal walk in `interactions.tsx` recognises a code tab by
 * `data-article-panel` exactly as it recognises the other two.
 */
const ArticleCodeTabPanel = ({
  children,
  label,
}: {
  readonly children: ReactNode;
  readonly label: string;
}) => {
  const context = useRequiredCodeTabsContext();
  const active = context.selected === label;
  const panelRef = useArticleFoundPanel(() => {
    context.select(label);
  }, !active);

  return (
    <TabsPrimitive.Content asChild forceMount value={label}>
      <article-panel
        data-article-panel="code-tab"
        hidden={active ? undefined : "until-found"}
        ref={panelRef}
        style={{ display: "block" }}
      >
        {children}
      </article-panel>
    </TabsPrimitive.Content>
  );
};

export const ArticleCodeTabs = ({
  children,
  groupId,
  labels: serializedLabels,
}: ArticleCodeTabsProps) => {
  const labels = useMemo(
    () => parseCodeTabLabels(serializedLabels),
    [serializedLabels]
  );
  const panels = useMemo(() => flattenChildren(children), [children]);
  const defaultLabel = labels[0] ?? "";
  const [selected, setSelected] = useState(defaultLabel);

  /*
   * The saved preference is applied after the first paint rather than during
   * render. The server has no storage, so reading it while rendering would emit
   * one tab on the server and another on the client; the first frame is always
   * the authored default, and a remembered choice replaces it a tick later.
   */
  useEffect(() => {
    const saved =
      groupId === undefined
        ? undefined
        : readCodeTabPreference(window.localStorage, groupId, labels);
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setSelected(saved ?? defaultLabel);
      }
    });

    const synchronize = (event: WindowEventMap[typeof CODE_TAB_EVENT]) => {
      const synchronized = matchSynchronizedCodeTab(
        groupId,
        labels,
        event.detail
      );
      if (synchronized !== undefined) {
        setSelected(synchronized);
      }
    };

    window.addEventListener(CODE_TAB_EVENT, synchronize);

    return () => {
      active = false;
      window.removeEventListener(CODE_TAB_EVENT, synchronize);
    };
  }, [defaultLabel, groupId, labels]);

  const select = useCallback(
    (label: string) => {
      setSelected(label);
      if (groupId === undefined) {
        return;
      }
      writeCodeTabPreference(window.localStorage, groupId, label);
      window.dispatchEvent(
        new CustomEvent<CodeTabChangeDetail>(CODE_TAB_EVENT, {
          detail: { groupId, label },
        })
      );
    },
    [groupId]
  );

  const context = useMemo<ArticleCodeTabsContextValue>(
    () => ({ select, selected }),
    [select, selected]
  );

  return (
    <TabsPrimitive.Root
      activationMode="automatic"
      asChild
      onValueChange={select}
      value={selected}
    >
      <section data-code-tabs="" data-tab-group={groupId}>
        <ArticleCodeTabsContext value={context}>
          <TabsPrimitive.List aria-label="Code examples">
            {labels.map((label) => (
              <TabsPrimitive.Trigger key={label} value={label}>
                {label}
              </TabsPrimitive.Trigger>
            ))}
          </TabsPrimitive.List>
          {panels.map((panel, index) => (
            <ArticleCodeTabPanel
              key={labels[index] ?? index}
              label={labels[index] ?? ""}
            >
              {panel}
            </ArticleCodeTabPanel>
          ))}
        </ArticleCodeTabsContext>
      </section>
    </TabsPrimitive.Root>
  );
};
