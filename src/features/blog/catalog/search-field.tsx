"use client";

import { SearchIcon, XIcon } from "lucide-react";
import type { RefObject } from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/shared/ui/input-group";

/**
 * The Article search field.
 *
 * It is never autofocused and carries no `/` shortcut: the Blog is a page a
 * visitor arrives at to read, not a search tool, and stealing focus on load
 * moves the viewport away from the first Articles.
 *
 * Escape and the Clear control do exactly one thing — remove the query — and
 * both leave the visitor in the field. Escape on an already-empty query is
 * inert so it can still reach whatever else is listening for it.
 */
export const SearchField = ({
  enabled,
  fieldRef,
  onBlur,
  onClear,
  onQueryChange,
  query,
}: {
  enabled: boolean;
  fieldRef?: RefObject<HTMLInputElement | null>;
  onBlur?: () => void;
  onClear?: () => void;
  onQueryChange: (query: string) => void;
  query: string;
}) => (
  <InputGroup className="h-9 rounded-lg shadow-none">
    <InputGroupInput
      aria-label="Search Articles"
      disabled={!enabled}
      onBlur={onBlur}
      onChange={(event) => {
        onQueryChange(event.target.value);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && query.length > 0) {
          event.preventDefault();
          onClear?.();
        }
      }}
      placeholder="Search articles…"
      ref={fieldRef}
      type="search"
      value={query}
    />

    <InputGroupAddon align="inline-start">
      <SearchIcon aria-hidden />
    </InputGroupAddon>

    <InputGroupAddon
      align="inline-end"
      className="pr-2.25 data-[disabled=true]:hidden"
      data-disabled={query.length === 0}
    >
      <InputGroupButton
        aria-label="Clear search"
        className="rounded-sm border-none"
        onClick={onClear}
        size="icon-xs"
        title="Clear search"
      >
        <XIcon aria-hidden />
      </InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
);
