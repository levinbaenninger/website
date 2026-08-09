// The two Article outline surfaces: the desktop gutter minimap and the mobile
// "On this page" card.
//
// Both render the same list from the same projection and differ only in how a
// visitor asks for it. Geometry, indentation and timings are transposed from
// ncdai/chanhdai.com @ 83e0b842 (MIT, © Chánh Đại): `src/components/toc-minimap.tsx`
// and `src/components/toc-inline.tsx`. Composition accepted on #33, behaviour
// specified on #36.

"use client";

import { ChevronDownIcon, TextIcon } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { Popover } from "radix-ui";
import { useRef } from "react";

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
import type { ArticleOutlineHeading } from "./types";

interface ArticleOutlineProps {
  readonly outline: readonly ArticleOutlineHeading[];
}

/**
 * The href a heading link carries.
 *
 * A real, encoded fragment: the link works before hydration, it survives being
 * copied out of the context menu, and it round-trips through the
 * `decodeURIComponent` that fragment navigation resolves it with.
 */
const fragmentFor = (id: string): string => `#${encodeURIComponent(id)}`;

const useOutlineSelection = () => {
  // `useReducedMotion` reports `null` until it has read the media query, and an
  // unknown preference is not a stated one.
  const reducedMotion = useReducedMotion() ?? false;

  return (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Modified clicks belong to the browser: a new tab on a fragment link is a
    // fresh page load, and this handler would keep it in the current one.
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

/**
 * The heading list, shared by both surfaces.
 *
 * One flat list with indentation rather than nested lists: the outline is a
 * reading order, and three levels of nesting announce a tree a visitor is not
 * navigating. `aria-current="location"` is what says which entry is the one
 * being read — the colour alone says it to some visitors only.
 */
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

/** The decorative depth bars. 24 / 16 / 8 px for depth two, three and four. */
const ArticleOutlineBars = ({
  activeId,
  outline,
}: ArticleOutlineProps & { readonly activeId: string | null }) => (
  <>
    {outline.map((heading) => (
      <div
        aria-hidden
        className={cn(
          // The reference draws inactive bars with `bg-ring/50`. This
          // repository's `--ring` is pure black in both themes, so that lands as
          // black-on-near-black in dark mode; `muted-foreground` is the token
          // that actually flips, and it keeps the light-mode weight.
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

/**
 * Brings the item a visitor is about to read into view inside the list.
 *
 * The scroll is written onto the list's own `scrollTop` and the focus is taken
 * with `preventScroll`, because the one thing opening a table of contents must
 * not do is move the page the visitor is reading. `scrollIntoView` would walk
 * up through every scrollable ancestor to the document itself.
 */
const revealInsideList = (list: HTMLElement, link: HTMLElement): void => {
  const listBox = list.getBoundingClientRect();
  const linkBox = link.getBoundingClientRect();

  list.scrollTop +=
    linkBox.top - listBox.top - (listBox.height - linkBox.height) / 2;
  link.focus({ preventScroll: true });
};

const LIST_FRAME =
  "z-50 flex max-h-[calc(100dvh-(--spacing(30)))] w-56 overflow-y-auto overscroll-contain rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-border";

/**
 * The desktop gutter minimap.
 *
 * The bars are a picture of the Article: how many sections there are, how deep
 * they go, and where in them the visitor is. The list they open is the same
 * information in words, and it opens on click alone — a hover-opened panel over
 * a column of prose is a panel that opens while a visitor is reaching for the
 * scrollbar.
 *
 * Focus goes to the heading being read, or the first when the visitor has not
 * reached one yet, so the list opens at the place it is about to be used from.
 * Escape closes it and Radix returns focus to the bars.
 */
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

/**
 * The mobile "On this page" card, inline at the top of the prose.
 *
 * Collapsed to begin with — the point of the Article is the Article, and a
 * table of contents that opens itself pushes the first paragraph off a phone
 * screen. Once a visitor opens it, it stays open for as long as they are on the
 * Article, including after they pick something from it: someone who wanted the
 * list once is likely to want it again, and a card that folds itself away after
 * every use has to be reopened every time.
 */
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
        "group/outline-card rounded-xl bg-[var(--surface)] font-sans text-[var(--surface-foreground)] inset-ring-1 inset-ring-border/64",
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
            // Full wrapping, unlike the desktop popover: the card has the width
            // of the prose column and no reason to cut a heading short.
            linkClassName="text-sm"
            outline={outline}
          />
        </nav>
      </CollapsibleContent>
    </Collapsible>
  );
};
