"use client";

import type { RefObject } from "react";
import { useRef } from "react";

import type { ArticleTagFacet } from "@/modules/blog/articles/types";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/ui/cn";

// The `All` option is a UI value only: an unfiltered catalog carries no `tag`
// parameter, so this string never reaches the URL.
export const ALL_TAGS = "all";

export const articleCountLabel = (count: number): string =>
  `${count} ${count === 1 ? "Article" : "Articles"}`;

interface TagFilterOption {
  readonly count: number;
  readonly disabled: boolean;
  readonly label: string;
  readonly value: string;
}

const STEP_BY_KEY: Readonly<Record<string, number>> = {
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -1,
};

const TagOption = ({
  count,
  disabled,
  label,
  onKeyDown,
  onSelect,
  optionRef,
  selected,
  value,
}: {
  count: number;
  disabled: boolean;
  label: string;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onSelect: (value: string) => void;
  optionRef: (node: HTMLInputElement | null) => void;
  selected: boolean;
  value: string;
}) => (
  <label className={cn("cursor-pointer", disabled ? "cursor-default" : null)}>
    <input
      checked={selected}
      className="peer sr-only"
      disabled={disabled}
      // No `name`: the group is controlled, and its keyboard behaviour is
      // explicit below. A shared name would only let a second copy of the
      // strip — the inert one, mid-swap — steal this group's checked state.
      onChange={() => {
        onSelect(value);
      }}
      onKeyDown={onKeyDown}
      ref={optionRef}
      // One stop for the whole group, the way a radio group behaves
      // everywhere else: Tab reaches the selected option, arrows do the rest.
      tabIndex={selected ? 0 : -1}
      type="radio"
      value={value}
    />
    <Badge
      className="peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:opacity-50"
      variant={selected ? "default" : "outline"}
    >
      {label}
      <span aria-hidden className="tabular-nums opacity-70">
        {count}
      </span>
    </Badge>
    <span className="sr-only">{articleCountLabel(count)}</span>
  </label>
);

/**
 * The Tag filter: `All` followed by every Tag in the stable order the server
 * sent, as one radio group with exactly one selected option.
 *
 * Arrow, Home and End are handled here rather than left to the browser. Native
 * radio groups move with the arrow keys but know nothing about Home and End,
 * and the movement has to skip disabled options and wrap, so the group owns
 * the whole policy instead of half of it.
 *
 * A Tag that matches nothing is a dead end and is disabled — unless it is the
 * selected one, which would leave the visitor unable to leave an empty
 * catalog from the keyboard.
 */
export const TagFilter = ({
  allOptionRef,
  articleCount,
  enabled,
  onSelect,
  selected,
  tags,
}: {
  allOptionRef?: RefObject<HTMLInputElement | null>;
  articleCount: number;
  enabled: boolean;
  onSelect: (value: string) => void;
  selected: string;
  tags: readonly ArticleTagFacet[];
}) => {
  const optionRefs = useRef(new Map<string, HTMLInputElement>());

  const options: readonly TagFilterOption[] = [
    { count: articleCount, disabled: false, label: "All", value: ALL_TAGS },
    ...tags.map((tag) => ({
      count: tag.articleCount,
      disabled: tag.articleCount === 0 && tag.id !== selected,
      label: tag.label,
      value: tag.id,
    })),
  ];

  const select = (value: string) => {
    onSelect(value);
    // Arrow movement selects and focuses together; the option outlives the
    // re-render, so the visitor stays exactly where the key took them.
    optionRefs.current.get(value)?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const reachable = options.filter((option) => !option.disabled);

    if (reachable.length === 0) {
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const target = event.key === "Home" ? reachable[0] : reachable.at(-1);

      if (target !== undefined) {
        select(target.value);
      }

      return;
    }

    const step = STEP_BY_KEY[event.key];

    if (step === undefined) {
      return;
    }

    event.preventDefault();
    const current = reachable.findIndex((option) => option.value === selected);
    const target =
      reachable[(current + step + reachable.length) % reachable.length];

    if (target !== undefined) {
      select(target.value);
    }
  };

  return (
    <div
      aria-label="Filter Articles by Tag"
      className="screen-line-bottom flex flex-wrap items-center gap-1.5 p-2"
      role="radiogroup"
    >
      {options.map((option) => (
        <TagOption
          count={option.count}
          disabled={!enabled || option.disabled}
          key={option.value}
          label={option.label}
          onKeyDown={handleKeyDown}
          onSelect={onSelect}
          optionRef={(node) => {
            if (node === null) {
              optionRefs.current.delete(option.value);
            } else {
              optionRefs.current.set(option.value, node);
            }

            if (option.value === ALL_TAGS && allOptionRef !== undefined) {
              allOptionRef.current = node;
            }
          }}
          selected={selected === option.value}
          value={option.value}
        />
      ))}
    </div>
  );
};
