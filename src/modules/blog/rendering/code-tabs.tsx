"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { ReactNode } from "react";

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

interface ArticleCodeTabsProps {
  readonly children?: ReactNode;
  readonly groupId?: string;
  readonly labels: string;
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
  const id = useId();

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
      if (groupId === undefined) {
        return;
      }

      const { detail } = event;
      const synchronized = matchSynchronizedCodeTab(groupId, labels, detail);
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

  const select = (label: string) => {
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
  };

  return (
    <section data-code-tabs="" data-tab-group={groupId}>
      <div aria-label="Code examples" role="tablist">
        {labels.map((label, index) => (
          <button
            aria-controls={`${id}-panel-${index}`}
            aria-selected={selected === label}
            id={`${id}-tab-${index}`}
            key={label}
            onClick={() => {
              select(label);
            }}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      {panels.map((panel, index) => {
        const label = labels[index] ?? "";
        return (
          <div
            aria-labelledby={`${id}-tab-${index}`}
            hidden={selected !== label}
            id={`${id}-panel-${index}`}
            key={label}
            role="tabpanel"
          >
            {panel}
          </div>
        );
      })}
    </section>
  );
};
