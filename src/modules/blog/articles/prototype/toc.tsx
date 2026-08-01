// PROTOTYPE — throwaway. Delete this directory once issue #33 is decided.
//
// The three table-of-contents surfaces. Geometry, indentation, colours and
// timings are transposed 1:1 from ncdai/chanhdai.com @ 83e0b842
// (MIT, © Chánh Đại): `src/components/toc-minimap.tsx` and
// `src/components/toc-inline.tsx`.

"use client";

import { ChevronDownIcon, ListIcon, TextIcon } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { HoverCard, Popover } from "radix-ui";

import type { ArticleHeadingFact } from "@/modules/blog/articles/facts";
import { tick002Sound } from "@/shared/audio/sounds/tick-002";
import { useSound } from "@/shared/audio/use-sound";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/ui/cn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";

import type { TocJump } from "./params";
import { jumpToHeading } from "./toc-navigation";

interface TocProps {
  readonly activeId: string | null;
  readonly headings: readonly ArticleHeadingFact[];
  readonly jump: TocJump;
}

const useHeadingClick = (jump: TocJump) => {
  const reducedMotion = useReducedMotion() ?? false;

  return (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const id = event.currentTarget.getAttribute("href")?.slice(1) ?? "";
    jumpToHeading(id, { jump, reducedMotion });
  };
};

// The 224 px heading list. Shared by the minimap popup, the toolbar popover and
// the mobile card so all three stay one projection.
const TocList = ({ activeId, headings, jump }: TocProps) => {
  const onClick = useHeadingClick(jump);

  return (
    <ul className="flex size-full flex-col px-6 py-4 text-sm">
      {headings.map((heading) => (
        <li className="flex py-1" key={heading.id}>
          <a
            className={cn(
              "line-clamp-2 w-full text-muted-foreground transition-[color] duration-200 hover:text-foreground",
              "data-active:text-foreground",
              "data-[depth=3]:pl-4 data-[depth=4]:pl-8"
            )}
            data-active={heading.id === activeId ? "" : undefined}
            data-depth={heading.depth}
            href={`#${heading.id}`}
            onClick={onClick}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  );
};

const Minimap = ({
  activeId,
  headings,
}: Pick<TocProps, "activeId" | "headings">) => (
  <>
    {headings.map((heading) => (
      <div
        aria-hidden
        className={cn(
          // The reference draws inactive lines with `bg-ring/50`. This
          // repository's `--ring` is pure black in *both* themes, so that lands
          // as black-on-near-black in dark mode. `muted-foreground` is the token
          // that actually flips, and it keeps the light-mode weight.
          "pointer-events-none h-0.5 w-6 shrink-0 rounded-xs bg-muted-foreground transition-[background-color] duration-200 ease-out",
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

const MINIMAP_STACK =
  "flex max-h-[calc(100dvh-var(--doc-cols-top,0px)-(--spacing(24)))] flex-col gap-3 overflow-hidden py-3 pl-6 opacity-100 transition-opacity duration-200 data-[state=open]:opacity-0";

const LIST_FRAME =
  "z-50 flex max-h-[calc(100dvh-var(--doc-cols-top,0px)-(--spacing(24)))] w-56 overflow-y-auto overscroll-contain rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-border";

/**
 * Desktop gutter minimap. `reveal` decides whether the heading list is a hover
 * card (the reference) or a click-and-focus popover.
 */
export const TocMinimap = ({
  activeId,
  headings,
  jump,
  reveal,
}: TocProps & { readonly reveal: "gutter-click" | "gutter-hover" }) => {
  const [playOpen] = useSound(tick002Sound, { volume: 0.3 });

  if (headings.length === 0) {
    return null;
  }

  const list = <TocList activeId={activeId} headings={headings} jump={jump} />;

  if (reveal === "gutter-click") {
    return (
      <Popover.Root
        onOpenChange={(open) => {
          if (open) {
            playOpen();
          }
        }}
      >
        <div className="ml-auto w-18">
          <Popover.Trigger
            aria-label="On this page"
            className={cn(MINIMAP_STACK, "w-full cursor-pointer outline-none")}
          >
            <Minimap activeId={activeId} headings={headings} />
          </Popover.Trigger>
        </div>

        <Popover.Portal>
          <Popover.Content
            align="start"
            alignOffset={0}
            className={cn(
              LIST_FRAME,
              "duration-200 data-[side=left]:slide-in-from-right-3 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
            )}
            side="left"
            sideOffset={-60}
          >
            {list}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    );
  }

  return (
    <HoverCard.Root
      closeDelay={100}
      onOpenChange={(open) => {
        if (open) {
          playOpen();
        }
      }}
      openDelay={100}
    >
      <div className="ml-auto w-18">
        {/* The reference trigger is a plain div, so the list is pointer-only. A
            button keeps the geometry and opens the list on focus too, which the
            research inventory requires. */}
        <HoverCard.Trigger asChild>
          <button
            aria-label="On this page"
            className={cn(MINIMAP_STACK, "w-full cursor-default outline-none")}
            type="button"
          >
            <Minimap activeId={activeId} headings={headings} />
          </button>
        </HoverCard.Trigger>
      </div>

      <HoverCard.Portal>
        <HoverCard.Content
          align="start"
          alignOffset={0}
          className={cn(
            LIST_FRAME,
            "duration-200 data-[side=left]:slide-in-from-right-3 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
          )}
          side="left"
          sideOffset={-60}
        >
          {list}
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
};

/** Mobile "On this page" card, inline in the prose column. */
export const TocInline = ({
  activeId,
  className,
  headings,
  jump,
}: TocProps & { readonly className?: string }) => {
  const onClick = useHeadingClick(jump);

  if (headings.length === 0) {
    return null;
  }

  return (
    <Collapsible
      className={cn(
        // The reference uses its own `surface` token: zinc-50 / zinc-900. This
        // repository has no equivalent, so the exact reference values are
        // inlined here rather than adding a global token in a planning ticket.
        "group/inline-toc not-typeset rounded-xl bg-[oklch(0.985_0_0)] font-sans inset-ring-1 inset-ring-border/64 dark:bg-[oklch(0.21_0.006_285.823)]",
        className
      )}
    >
      <CollapsibleTrigger className="inline-flex w-full items-center gap-2 rounded-xl py-2.5 pr-2 pl-4 text-sm font-medium outline-none group-data-[state=open]/inline-toc:rounded-b-none focus-visible:inset-ring-2 focus-visible:inset-ring-ring/50 [&_svg]:size-4">
        <TextIcon aria-hidden className="-translate-x-0.5" />
        On this page
        <div className="ml-auto shrink-0 text-muted-foreground">
          <ChevronDownIcon
            aria-hidden
            className="transition-transform duration-150 group-data-[state=open]/inline-toc:rotate-180"
          />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <ul className="flex flex-col px-4 pb-2">
          {headings.map((heading) => (
            <li className="flex py-1" key={heading.id}>
              <a
                className="text-sm text-muted-foreground transition-colors hover:text-accent-foreground data-[depth=3]:pl-4 data-[depth=4]:pl-8 data-active:text-foreground"
                data-active={heading.id === activeId ? "" : undefined}
                data-depth={heading.depth}
                href={`#${heading.id}`}
                onClick={onClick}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
};

/** Toolbar control that opens the same heading list at every width. */
export const TocToolbarButton = ({ activeId, headings, jump }: TocProps) => {
  const [playOpen] = useSound(tick002Sound, { volume: 0.3 });

  if (headings.length === 0) {
    return null;
  }

  return (
    <Popover.Root
      onOpenChange={(open) => {
        if (open) {
          playOpen();
        }
      }}
    >
      <Popover.Trigger asChild>
        <Button
          aria-label="On this page"
          className="size-7 border-none"
          size="icon-sm"
          variant="secondary"
        >
          <ListIcon aria-hidden />
        </Button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          className={cn(
            LIST_FRAME,
            "max-h-[min(24rem,calc(100dvh-8rem))] duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0"
          )}
          sideOffset={8}
        >
          <TocList activeId={activeId} headings={headings} jump={jump} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
