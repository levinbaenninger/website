// PROTOTYPE — throwaway. Delete this directory once issue #32 is decided.
//
// The parts of Chánh Đại's Blog catalog that are already settled by issue #31
// and must stay identical across every variant: page heading, the 36 px search
// field in its lined strip, and the 1200:630 grayscale Cover frame.
// Adapted from ncdai/chanhdai.com @ 83e0b842 (MIT, © Chánh Đại).

"use client";

import { format, parseISO } from "date-fns";
import { SearchIcon, XIcon } from "lucide-react";
import Image from "next/image";
import type * as React from "react";

import type { ArticleCover } from "@/modules/blog/articles/types";
import type { HighlightedText } from "@/modules/blog/search";
import { cn } from "@/shared/ui/cn";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/shared/ui/input-group";

export const PageHeading = ({
  tagline,
  title,
}: {
  tagline: string;
  title: string;
}) => (
  <div className="group/page-heading">
    <div className="px-4 pb-2 font-heading text-sm/none font-medium tracking-wider text-muted-foreground">
      {tagline}
    </div>
    {/* Deviation: the reference h1 has no vertical padding. py-2 is Levin's
        call — the title read as cramped between its two guide lines. */}
    <h1 className="screen-line-top screen-line-bottom px-4 py-2 font-heading text-4xl font-medium tracking-tight text-balance">
      {title}
    </h1>
  </div>
);

export const SearchField = ({
  className,
  onQueryChange,
  query,
}: {
  className?: string;
  onQueryChange: (query: string) => void;
  query: string;
}) => (
  <InputGroup className={cn("h-9 rounded-lg shadow-none", className)}>
    <InputGroupInput
      onChange={(event) => {
        onQueryChange(event.target.value);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onQueryChange("");
        }
      }}
      placeholder="Search articles…"
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
        aria-label="Clear"
        className="rounded-sm border-none"
        onClick={() => {
          onQueryChange("");
        }}
        size="icon-xs"
        title="Clear"
      >
        <XIcon aria-hidden />
      </InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
);

export const CoverFrame = ({
  alt,
  className,
  cover,
  eager = false,
  ringClassName,
}: {
  alt: string;
  className?: string;
  cover: ArticleCover;
  eager?: boolean;
  ringClassName?: string;
}) => (
  <div className="relative select-none [--image-radius:12px]">
    <Image
      alt={alt}
      className={cn(
        "aspect-1200/630 w-full rounded-(--image-radius) grayscale transition-[filter] duration-300 ease-[cubic-bezier(0.42,0,0.58,1)] group-hover/post:grayscale-0",
        className
      )}
      height={cover.height}
      loading={eager ? "eager" : "lazy"}
      src={cover.src}
      unoptimized
      width={cover.width}
    />
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 rounded-(--image-radius) inset-ring-1 inset-ring-black/15 dark:inset-ring-white/15",
        ringClassName
      )}
    />
  </div>
);

export const formatArticleDate = (isoDate: string): string =>
  format(parseISO(isoDate), "dd.MM.yyyy");

export const PublishedDate = ({
  className,
  isoDate,
  label = "Published on",
  prefix,
}: {
  className?: string;
  isoDate: string;
  label?: string;
  prefix?: string;
}) => (
  <dl className={className}>
    <dt className="sr-only">{label}</dt>
    <dd className="text-sm text-muted-foreground">
      {prefix === undefined ? null : `${prefix} `}
      <time dateTime={isoDate}>{formatArticleDate(isoDate)}</time>
    </dd>
  </dl>
);

export const Highlight = ({ value }: { value: HighlightedText }) => {
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const [index, range] of value.highlights.entries()) {
    if (range.start > cursor) {
      parts.push(value.text.slice(cursor, range.start));
    }
    parts.push(
      <mark
        className="rounded-xs bg-foreground/10 text-foreground"
        key={`${range.start}-${index}`}
      >
        {value.text.slice(range.start, range.end)}
      </mark>
    );
    cursor = range.end;
  }

  if (cursor < value.text.length) {
    parts.push(value.text.slice(cursor));
  }

  return <span>{parts}</span>;
};
