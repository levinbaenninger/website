"use client";

import type { RefObject } from "react";
import { useRef } from "react";

import type { ArticleTagFacet } from "@/features/blog/articles/types";
import type { HighlightRange } from "@/features/blog/search/service";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/ui/cn";

import { HighlightedText } from "./highlighted-text";

// The `All` option is a UI value only: an unfiltered catalog carries no `tag`
// parameter, so this string never reaches the URL.
export const ALL_TAGS = "all";

export const articleCountLabel = (count: number): string =>
  `${count} ${count === 1 ? "Article" : "Articles"}`;

interface TagFilterOption {
  readonly count: number;
  readonly disabled: boolean;
  readonly highlights: readonly HighlightRange[];
  readonly label: string;
  readonly value: string;
}

const NO_HIGHLIGHTS: readonly HighlightRange[] = [];

const STEP_BY_KEY: Readonly<Record<string, number>> = {
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -1,
};

const TagOption = ({
  count,
  disabled,
  highlights,
  label,
  onKeyDown,
  onSelect,
  optionRef,
  selected,
  value,
}: {
  count: number;
  disabled: boolean;
  highlights: readonly HighlightRange[];
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
      // Single tab stop: Tab lands on the selected option, arrows move.
      tabIndex={selected ? 0 : -1}
      type="radio"
      value={value}
    />
    {/* Chip is visual only: highlighting splits a label into `Next . js`, so
        the accessible name lives on the sr-only line beside it. */}
    <Badge
      aria-hidden
      className="peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:opacity-50"
      variant={selected ? "default" : "outline"}
    >
      <HighlightedText value={{ highlights, text: label }} />
      <span className="tabular-nums opacity-70">{count}</span>
    </Badge>
    <span className="sr-only">{`${label} ${articleCountLabel(count)}`}</span>
  </label>
);

/**
 * Keyboard is owned here because native radios skip Home/End, disabled options,
 * and wrap. A selected empty Tag stays enabled so the keyboard can leave.
 * Tag-only matches are explained on the chips, not the cards.
 */
export const TagFilter = ({
  allOptionRef,
  articleCount,
  busy = false,
  enabled,
  highlights,
  onSelect,
  selected,
  tags,
}: {
  allOptionRef?: RefObject<HTMLInputElement | null>;
  articleCount: number;
  busy?: boolean;
  enabled: boolean;
  highlights?: ReadonlyMap<string, readonly HighlightRange[]>;
  onSelect: (value: string) => void;
  selected: string;
  tags: readonly ArticleTagFacet[];
}) => {
  const optionRefs = useRef(new Map<string, HTMLInputElement>());

  const options: readonly TagFilterOption[] = [
    {
      count: articleCount,
      disabled: false,
      highlights: NO_HIGHLIGHTS,
      label: "All",
      value: ALL_TAGS,
    },
    ...tags.map((tag) => ({
      count: tag.articleCount,
      disabled: tag.articleCount === 0 && tag.id !== selected,
      highlights: highlights?.get(tag.id) ?? NO_HIGHLIGHTS,
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
      aria-busy={busy || undefined}
      aria-label="Filter Articles by Tag"
      className="screen-line-bottom flex flex-wrap items-center gap-1.5 p-2"
      role="radiogroup"
    >
      {options.map((option) => (
        <TagOption
          count={option.count}
          disabled={!enabled || option.disabled}
          highlights={option.highlights}
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
