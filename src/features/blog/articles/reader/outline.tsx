"use client";

import { ChevronDownIcon, TextIcon } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { Popover } from "radix-ui";
import { useRef } from "react";

import type { ArticleOutlineHeading } from "@/features/blog/articles/types";
import { useArticleFragmentNavigation } from "@/features/blog/rendering/reveal";
import { tick002Sound } from "@/shared/audio/sounds/tick-002";
import { useSound } from "@/shared/audio/use-sound";
import { cn } from "@/shared/ui/cn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";

import {
  selectOutlineHeading,
  useActiveOutlineHeadingId,
} from "./outline-navigation";

interface ArticleOutlineProps {
  readonly outline: readonly ArticleOutlineHeading[];
}

const fragmentFor = (id: string): string => `#${encodeURIComponent(id)}`;

const useOutlineSelection = () => {
  const reducedMotion = useReducedMotion() ?? false;

  return (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Modified clicks belong to the browser: a new tab on a fragment link is a fresh page load.
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    const id = event.currentTarget.dataset.headingId;

    if (id === undefined) {
      return;
    }

    event.preventDefault();
    selectOutlineHeading(id, { reducedMotion });
  };
};

const ArticleOutlineList = ({
  activeId,
  className,
  linkClassName,
  outline,
}: ArticleOutlineProps & {
  readonly activeId: string | null;
  readonly className: string;
  readonly linkClassName: string;
}) => {
  const onSelect = useOutlineSelection();

  return (
    <ul className={className}>
      {outline.map((heading) => (
        <li className="flex py-1" key={heading.id}>
          <a
            aria-current={heading.id === activeId ? "location" : undefined}
            className={cn(
              "w-full text-muted-foreground transition-colors duration-200 hover:text-foreground",
              "data-[depth=3]:pl-4 data-[depth=4]:pl-8",
              "aria-[current=location]:text-foreground",
              linkClassName
            )}
            data-depth={heading.depth}
            data-heading-id={heading.id}
            href={fragmentFor(heading.id)}
            onClick={onSelect}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  );
};

const ArticleOutlineBars = ({
  activeId,
  outline,
}: ArticleOutlineProps & { readonly activeId: string | null }) => (
  <>
    {outline.map((heading) => (
      <div
        aria-hidden
        className={cn(
          // `--ring` is pure black in both themes, so `muted-foreground` instead of `bg-ring/50`.
          "pointer-events-none h-0.5 w-6 shrink-0 rounded-xs bg-muted-foreground transition-colors duration-200 ease-out",
          "data-[depth=3]:ml-2 data-[depth=3]:w-4",
          "data-[depth=4]:ml-4 data-[depth=4]:w-2",
          "data-active:bg-foreground"
        )}
        data-active={heading.id === activeId ? "" : undefined}
        data-depth={heading.depth}
        key={heading.id}
      />
    ))}
  </>
);

// `scrollIntoView` would scroll the page; write the list's `scrollTop` and focus with `preventScroll`.
const revealInsideList = (list: HTMLElement, link: HTMLElement): void => {
  const listBox = list.getBoundingClientRect();
  const linkBox = link.getBoundingClientRect();

  list.scrollTop +=
    linkBox.top - listBox.top - (listBox.height - linkBox.height) / 2;
  link.focus({ preventScroll: true });
};

const LIST_FRAME =
  "z-50 flex max-h-[calc(100dvh-(--spacing(30)))] w-56 overflow-y-auto overscroll-contain rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-border";

// Click, not hover: a hover panel over prose opens while reaching for the scrollbar.
export const ArticleOutlineMinimap = ({ outline }: ArticleOutlineProps) => {
  useArticleFragmentNavigation();
  const activeId = useActiveOutlineHeadingId(outline);
  const [playOpen] = useSound(tick002Sound, { volume: 0.3 });
  const listRef = useRef<HTMLDivElement>(null);

  return (
    <Popover.Root
      onOpenChange={(open) => {
        if (open) {
          playOpen();
        }
      }}
    >
      <div className="ml-auto w-18" data-slot="article-outline-minimap">
        <Popover.Trigger
          aria-label="On this page"
          className="flex max-h-[calc(100dvh-(--spacing(30)))] w-full cursor-pointer flex-col gap-3 overflow-hidden py-3 pl-6 opacity-100 transition-opacity duration-200 outline-none data-[state=open]:opacity-0"
        >
          <ArticleOutlineBars activeId={activeId} outline={outline} />
        </Popover.Trigger>
      </div>

      <Popover.Portal>
        <Popover.Content
          align="start"
          className={cn(
            LIST_FRAME,
            "duration-200 data-[side=left]:slide-in-from-right-3 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
          )}
          onOpenAutoFocus={(event) => {
            const list = listRef.current;

            if (list === null) {
              return;
            }

            const link =
              list.querySelector<HTMLElement>('a[aria-current="location"]') ??
              list.querySelector<HTMLElement>("a");

            if (link !== null) {
              event.preventDefault();
              revealInsideList(list, link);
            }
          }}
          ref={listRef}
          side="left"
          sideOffset={-60}
        >
          <nav aria-label="On this page" className="size-full">
            <ArticleOutlineList
              activeId={activeId}
              className="flex size-full flex-col px-6 py-4 text-sm"
              linkClassName="line-clamp-2"
              outline={outline}
            />
          </nav>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export const ArticleOutlineCard = ({
  className,
  outline,
}: ArticleOutlineProps & { readonly className?: string }) => {
  useArticleFragmentNavigation();
  const activeId = useActiveOutlineHeadingId(outline);
  const [playOpen] = useSound(tick002Sound, { volume: 0.3 });

  return (
    <Collapsible
      className={cn(
        "group/outline-card rounded-xl font-sans inset-ring-1 inset-ring-border/64",
        className
      )}
      data-slot="article-outline-card"
      onOpenChange={(open) => {
        if (open) {
          playOpen();
        }
      }}
    >
      <CollapsibleTrigger className="inline-flex w-full items-center gap-2 rounded-xl py-2.5 pr-2 pl-4 text-sm font-medium outline-none group-data-[state=open]/outline-card:rounded-b-none focus-visible:inset-ring-2 focus-visible:inset-ring-ring/50 [&_svg]:size-4">
        <TextIcon aria-hidden className="-translate-x-0.5" />
        On this page
        <div className="ml-auto shrink-0 text-muted-foreground">
          <ChevronDownIcon
            aria-hidden
            className="transition-transform duration-150 group-data-[state=open]/outline-card:rotate-180 motion-reduce:transition-none"
          />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <nav aria-label="On this page">
          <ArticleOutlineList
            activeId={activeId}
            className="flex flex-col px-4 pb-2"
            linkClassName="text-sm"
            outline={outline}
          />
        </nav>
      </CollapsibleContent>
    </Collapsible>
  );
};
