// PROTOTYPE — throwaway. Delete this directory once issue #33 is decided.
//
// The parts of Chánh Đại's Article reader that issue #31 already settled and
// that must therefore stay identical across every variant: the lined rail, the
// 44 px action row, the back link, the 16 px lined spacer, the 36 px title, the
// three-column desktop grid, and the prose column.
// Transposed from ncdai/chanhdai.com @ 83e0b842 (MIT, © Chánh Đại).

"use client";

import { formatForDisplay, useHotkey } from "@tanstack/react-hotkeys";
import { format, parseISO } from "date-fns";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { Tag } from "@/modules/blog/articles/tags";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/ui/cn";
import { Kbd } from "@/shared/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import type { PrototypeNeighbour } from "./fixtures";
import type { ArticleState } from "./params";

/**
 * Publishes the bottom of the title as `--doc-cols-top` so the desktop table of
 * contents can stick level with the first line of prose, and flags readiness so
 * it does not flash in at the wrong offset. Reference: `DocPageRoot`.
 */
export const ReaderRoot = ({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    const title =
      container?.querySelector<HTMLElement>('[data-slot="doc-title"]') ?? null;

    if (container !== null && title !== null) {
      document.documentElement.style.setProperty(
        "--doc-cols-top",
        `${title.getBoundingClientRect().bottom + window.scrollY}px`
      );
      container.dataset.docColsReady = "";
    }

    return () => {
      document.documentElement.style.removeProperty("--doc-cols-top");
      if (container !== null) {
        delete container.dataset.docColsReady;
      }
    };
  }, []);

  return (
    <div className={className} ref={ref} {...props}>
      {children}
    </div>
  );
};

/** The site header plus C's toolbar: what a sticky bar covers at the top. */
const STICKY_CHROME_PX = 92;

/**
 * True once the Article title has slid under the sticky chrome.
 *
 * An `IntersectionObserver` rather than a scroll listener, matching how
 * `toc-navigation.ts` tracks the active heading. The negative top margin shrinks
 * the root by the height of the fixed chrome, so the title counts as gone at the
 * moment it disappears behind the toolbar rather than when it leaves the
 * viewport — 92 px later, which is exactly the window where the toolbar says
 * nothing and the title is no longer readable.
 */
export const useTitleBehindChrome = (): boolean => {
  const [behind, setBehind] = useState(false);

  useEffect(() => {
    const title = document.querySelector<HTMLElement>(
      '[data-slot="doc-title"]'
    );

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        if (entry !== undefined) {
          setBehind(!entry.isIntersecting);
        }
      },
      { rootMargin: `-${STICKY_CHROME_PX}px 0px 0px 0px`, threshold: 0 }
    );

    if (title !== null) {
      observer.observe(title);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return behind;
};

/** The 48 rem lined rail. Reference: `DocContainer`. */
export const ReaderRail = ({
  children,
  className,
}: {
  readonly children?: React.ReactNode;
  readonly className?: string;
}) => (
  <div
    className={cn("mx-auto w-full border-x border-line md:w-3xl", className)}
  >
    {children}
  </div>
);

export const ReaderTopLine = () => <div className="screen-line-bottom h-px" />;

/**
 * The 16 px lined strip between the action row and the title.
 *
 * `screen-line-top` and `screen-line-bottom` are a `::before` at `top: 0` and an
 * `::after` at `bottom: 0`, so a strip stacked directly under another lined
 * block draws two adjacent 1 px rules — a 2 px line. C passes
 * `screen-line-top-none` because its sticky toolbar already owns that rule.
 */
export const ReaderTitleSpacer = ({
  className,
}: {
  readonly className?: string;
}) => (
  <div className={cn("screen-line-top screen-line-bottom py-px", className)}>
    <div className="h-4" />
  </div>
);

export const ReaderActionRow = ({
  children,
  className,
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
}) => (
  <div
    className={cn(
      "flex items-center justify-between p-2 pl-4 transition-opacity duration-300",
      // Focus mode: the root carries `data-chrome`, so every piece of chrome
      // recedes together.
      "in-data-[chrome=dim]:opacity-25 in-data-[chrome=dim]:focus-within:opacity-100 in-data-[chrome=dim]:hover:opacity-100 in-data-[chrome=hide]:hidden",
      className
    )}
  >
    {children}
  </div>
);

export const BackToBlog = () => (
  <Button
    asChild
    className="h-7 gap-1.5 border-none px-0 tracking-wider text-muted-foreground hover:text-foreground hover:no-underline"
    size="sm"
    variant="link"
  >
    <Link href="/blog">
      <ArrowLeftIcon aria-hidden />
      Blog
    </Link>
  </Button>
);

export const ReaderTitle = ({ children }: { readonly children: string }) => (
  <h1
    className="screen-line-bottom px-4 font-heading text-4xl font-medium tracking-tight text-balance"
    data-slot="doc-title"
  >
    {children}
  </h1>
);

const formatArticleDate = (isoDate: string): string =>
  format(parseISO(isoDate), "dd.MM.yyyy");

export const PROTOTYPE_PUBLISHED_AT = "2026-07-20";
export const PROTOTYPE_UPDATED_AT = "2026-07-24";

export const DraftBadge = () => (
  <Badge className="rounded-md" variant="outline">
    Draft
  </Badge>
);

/**
 * Dates, Tags and Draft state. The reference Article header carries none of
 * these, so every variant has to place them somewhere; only the typography is
 * held constant.
 */
export const ArticleMeta = ({
  className,
  state,
  tags,
}: {
  readonly className?: string;
  readonly state: ArticleState;
  readonly tags: readonly Tag[];
}) => (
  <div
    className={cn(
      "flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-muted-foreground",
      className
    )}
  >
    {state === "draft" ? (
      <>
        <DraftBadge />
        <span>Not published</span>
      </>
    ) : (
      <span>
        Published on{" "}
        <time dateTime={PROTOTYPE_PUBLISHED_AT}>
          {formatArticleDate(PROTOTYPE_PUBLISHED_AT)}
        </time>
      </span>
    )}

    {state === "updated" ? (
      <>
        <span aria-hidden>·</span>
        <span>
          Updated{" "}
          <time dateTime={PROTOTYPE_UPDATED_AT}>
            {formatArticleDate(PROTOTYPE_UPDATED_AT)}
          </time>
        </span>
      </>
    ) : null}

    {/* No separator before the Tags: the Badges already read as a break, and a
        dangling "·" is what is left behind when the list wraps. No extra nudge
        either — one gap value across the whole row is what makes it read as one
        row. */}
    {tags.length > 0 ? (
      <ul className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <li key={tag.id}>
            <Badge className="rounded-md" variant="secondary">
              {tag.label}
            </Badge>
          </li>
        ))}
      </ul>
    ) : null}
  </div>
);

const handleNeighbourActivation =
  (
    neighbour: PrototypeNeighbour,
    announce: (neighbour: PrototypeNeighbour) => void
  ) =>
  (event: React.MouseEvent) => {
    event.preventDefault();
    announce(neighbour);
  };

/**
 * Icon-only previous/next, with the reference's tooltip and Kbd hint.
 *
 * The fixture neighbours are not real Articles, so activating a control reports
 * where it would go instead of navigating. Only the chrome is under test.
 */
export const NeighbourButtons = ({
  next,
  announce,
  previous,
}: {
  readonly next: PrototypeNeighbour | null;
  readonly announce: (neighbour: PrototypeNeighbour) => void;
  readonly previous: PrototypeNeighbour | null;
}) => (
  <>
    {previous === null ? null : (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="Previous Article"
            asChild
            className="size-7 border-none"
            size="icon-sm"
            variant="secondary"
          >
            <a
              href={previous.href}
              onClick={handleNeighbourActivation(previous, announce)}
            >
              <ArrowLeftIcon aria-hidden />
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="pr-2 pl-3">
          <div className="flex items-center gap-3">
            Previous Article
            <Kbd>{formatForDisplay("ArrowLeft")}</Kbd>
          </div>
        </TooltipContent>
      </Tooltip>
    )}

    {next === null ? null : (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="Next Article"
            asChild
            className="size-7 border-none"
            size="icon-sm"
            variant="secondary"
          >
            <a
              href={next.href}
              onClick={handleNeighbourActivation(next, announce)}
            >
              <ArrowRightIcon aria-hidden />
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="pr-2 pl-3">
          <div className="flex items-center gap-3">
            Next Article
            <Kbd>{formatForDisplay("ArrowRight")}</Kbd>
          </div>
        </TooltipContent>
      </Tooltip>
    )}
  </>
);

/** ←/→ jump to the neighbouring Article, as the reference does. */
export const useNeighbourHotkeys = ({
  next,
  announce,
  previous,
}: {
  readonly next: PrototypeNeighbour | null;
  readonly announce: (neighbour: PrototypeNeighbour) => void;
  readonly previous: PrototypeNeighbour | null;
}) => {
  useHotkey("ArrowLeft", () => {
    if (previous !== null) {
      announce(previous);
    }
  });

  useHotkey("ArrowRight", () => {
    if (next !== null) {
      announce(next);
    }
  });
};

/** Titled previous/next cells after the prose. The reference has none. */
export const EndPager = ({
  next,
  announce,
  previous,
}: {
  readonly next: PrototypeNeighbour | null;
  readonly announce: (neighbour: PrototypeNeighbour) => void;
  readonly previous: PrototypeNeighbour | null;
}) => {
  if (previous === null && next === null) {
    return null;
  }

  return (
    <nav
      aria-label="Neighbouring Articles"
      className="screen-line-top grid grid-cols-1 sm:grid-cols-2"
    >
      {previous === null ? (
        <div className="hidden sm:block" />
      ) : (
        <a
          className="flex flex-col gap-1 border-line p-4 transition-colors hover:bg-accent max-sm:screen-line-bottom sm:border-r"
          href={previous.href}
          onClick={handleNeighbourActivation(previous, announce)}
        >
          <span className="flex items-center gap-1 text-sm tracking-wider text-muted-foreground">
            <ArrowLeftIcon aria-hidden className="size-3.5" />
            Previous
          </span>
          <span className="text-[0.9375rem]/6 font-medium text-balance">
            {previous.title}
          </span>
        </a>
      )}

      {next === null ? null : (
        <a
          className="flex flex-col items-end gap-1 p-4 text-right transition-colors hover:bg-accent"
          href={next.href}
          onClick={handleNeighbourActivation(next, announce)}
        >
          <span className="flex items-center gap-1 text-sm tracking-wider text-muted-foreground">
            Next
            <ArrowRightIcon aria-hidden className="size-3.5" />
          </span>
          <span className="text-[0.9375rem]/6 font-medium text-balance">
            {next.title}
          </span>
        </a>
      )}
    </nav>
  );
};

/** Viewport-wide three-column grid: rail stays centred, TOC gets the gutter. */
export const ReaderGrid = ({
  children,
}: {
  readonly children: React.ReactNode;
}) => (
  <div className="mx-auto grid w-full grid-cols-1 lg:grid-cols-[1fr_var(--container-3xl)_1fr]">
    {children}
  </div>
);

export const ReaderGutter = ({
  children,
  className,
}: {
  readonly children?: React.ReactNode;
  readonly className?: string;
}) => (
  <aside
    className={cn(
      "transition-opacity duration-300 max-lg:hidden",
      "in-data-[chrome=dim]:opacity-25 in-data-[chrome=dim]:focus-within:opacity-100 in-data-[chrome=dim]:hover:opacity-100 in-data-[chrome=hide]:invisible in-data-[chrome=hide]:opacity-0",
      className
    )}
  >
    {children}
  </aside>
);

/**
 * The prose column. `.typeset` is the repository's prose foundation; the
 * overrides bring it to the reference's 16/28 body and 20/18 px headings.
 */
export const ProseColumn = ({
  children,
  className,
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
}) => (
  <div
    className={cn(
      // `pb-8` is not a mirror of `pt-8`: the first block carries a 20 px top
      // margin on top of the padding, the last one carries nothing, so 32 px is
      // what makes the closing line sit like the opening one.
      "typeset px-4 pt-8 pb-8 text-base/7",
      "[&_h2]:text-xl [&_h2]:tracking-tight [&_h3]:text-lg [&_h3]:tracking-tight [&_h4]:text-base",
      "[&_:is(h2,h3,h4)]:scroll-mt-16 [&_:is(h2,h3,h4)]:font-medium [&_:is(h2,h3,h4)]:text-balance",
      className
    )}
  >
    {children}
  </div>
);

export const ReaderBottomLine = () => <div className="screen-line-top h-4" />;
