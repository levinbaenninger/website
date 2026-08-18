"use client";

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

import { ArticlePanel } from "@/features/blog/rendering/article-panel";
import { useArticleFoundPanel } from "@/features/blog/rendering/interactions";
import { flattenChildren } from "@/shared/ui/flatten-children";

import { parseCodeTabLabels } from "./code-tabs-contract.ts";

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
    // Storage throws in private mode/quota; wrap, don't feature-detect.
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

// Inactive panels stay mounted with hidden="until-found" so find-in-page can reveal them.
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
      <ArticlePanel
        data-article-panel="code-tab"
        hidden={active ? undefined : "until-found"}
        ref={panelRef}
      >
        {children}
      </ArticlePanel>
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
  // Don't inspect props.children across the RSC boundary (lazy ref during SSR vs element after hydration).
  const panels = useMemo(() => flattenChildren(children), [children]);
  const defaultLabel = labels[0] ?? "";
  const [selected, setSelected] = useState(defaultLabel);

  // Apply storage after first paint; reading during render would mismatch SSR.
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
