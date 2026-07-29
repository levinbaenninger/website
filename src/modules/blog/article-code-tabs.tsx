"use client";

import { Children, useEffect, useId, useMemo, useState } from "react";
import type { ReactNode } from "react";

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

export const ArticleCodeTabs = ({
  children,
  groupId,
  labels: serializedLabels,
}: ArticleCodeTabsProps) => {
  const labels = useMemo(
    () => serializedLabels.split("\u0000"),
    [serializedLabels]
  );
  const panels = Children.toArray(children);
  const [selected, setSelected] = useState(labels[0] ?? "");
  const id = useId();

  useEffect(() => {
    const synchronize = (event: WindowEventMap[typeof CODE_TAB_EVENT]) => {
      const { detail } = event;
      if (detail.groupId === groupId && labels.includes(detail.label)) {
        setSelected(detail.label);
      }
    };
    if (groupId !== undefined) {
      const saved = readCodeTabPreference(localStorage, groupId, labels);
      if (saved !== undefined) {
        setSelected(saved);
      }
      window.addEventListener(CODE_TAB_EVENT, synchronize);
    }
    return () => {
      if (groupId !== undefined) {
        window.removeEventListener(CODE_TAB_EVENT, synchronize);
      }
    };
  }, [groupId, labels]);

  const select = (label: string) => {
    setSelected(label);
    if (groupId === undefined) {
      return;
    }
    writeCodeTabPreference(localStorage, groupId, label);
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
