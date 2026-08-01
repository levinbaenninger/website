// PROTOTYPE — throwaway. Delete this directory once issue #33 is decided.
//
// Three arrangements of the same reader. Variant A is a 1:1 transposition of
// ncdai/chanhdai.com @ 83e0b842 `app/blog/[slug]/page.tsx` (MIT, © Chánh Đại)
// with the four Levin-only concerns folded in where the reference has room for
// them. B and C move the same pieces somewhere else so the arrangement itself
// can be judged.

"use client";

import { EyeOffIcon, MinimizeIcon } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/ui/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import { PrototypeArticleBody } from "./article-body";
import {
  ArticleMeta,
  BackToBlog,
  EndPager,
  NeighbourButtons,
  ProseColumn,
  ReaderActionRow,
  ReaderBottomLine,
  ReaderGrid,
  ReaderGutter,
  ReaderRail,
  ReaderRoot,
  ReaderTitle,
  ReaderTitleSpacer,
  ReaderTopLine,
  useNeighbourHotkeys,
  useTitleBehindChrome,
} from "./reader-chrome";
import { useReader } from "./reader-context";
import { ShareControl } from "./share-control";
import { TocInline, TocMinimap, TocToolbarButton } from "./toc";

const Share = () => {
  const { meta } = useReader();

  return (
    <ShareControl
      surface={meta.selection.share}
      title={meta.article.title}
      url={meta.url}
    />
  );
};

const FocusToggle = () => {
  const { actions, state } = useReader();

  if (!state.focusAvailable) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={state.focusLabel}
          aria-pressed={state.focusEngaged}
          className="size-7 border-none"
          onClick={() => {
            actions.toggleFocus();
          }}
          size="icon-sm"
          variant={state.focusEngaged ? "default" : "secondary"}
        >
          {state.focusLabel === "Hide chrome" ? (
            <EyeOffIcon aria-hidden />
          ) : (
            <MinimizeIcon aria-hidden />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {state.focusEngaged ? "Restore chrome — Esc" : state.focusLabel}
      </TooltipContent>
    </Tooltip>
  );
};

const Neighbours = () => {
  const { actions, meta } = useReader();

  if (meta.selection.pager === "end") {
    return null;
  }

  return (
    <NeighbourButtons
      announce={actions.announceNeighbour}
      next={meta.next}
      previous={meta.previous}
    />
  );
};

const Pager = () => {
  const { actions, meta } = useReader();

  if (meta.selection.pager === "toolbar") {
    return null;
  }

  return (
    <EndPager
      announce={actions.announceNeighbour}
      next={meta.next}
      previous={meta.previous}
    />
  );
};

const ToolbarToc = () => {
  const { meta, state } = useReader();

  if (meta.selection.toc !== "toolbar") {
    return null;
  }

  return (
    <TocToolbarButton
      activeId={state.activeHeadingId}
      headings={meta.body.headings}
      jump={meta.selection.jump}
    />
  );
};

/** The gutter minimap, unless the table of contents moved into the toolbar. */
const GutterToc = () => {
  const { meta, state } = useReader();

  if (meta.selection.toc === "toolbar") {
    return <ReaderGutter />;
  }

  return (
    <ReaderGutter>
      {/* Reference geometry: the list hangs level with the first prose line and
          only appears once the title has been measured. */}
      <div className="sticky top-[calc(var(--doc-cols-top,0px)+(--spacing(3)))] translate-x-2 opacity-0 in-data-doc-cols-ready:opacity-100">
        <TocMinimap
          activeId={state.activeHeadingId}
          headings={meta.body.headings}
          jump={meta.selection.jump}
          reveal={meta.selection.toc}
        />
      </div>
    </ReaderGutter>
  );
};

/** Mobile "On this page" card. Redundant once the toolbar carries the list. */
const InlineToc = () => {
  const { meta, state } = useReader();

  if (meta.selection.toc === "toolbar") {
    return null;
  }

  return (
    <TocInline
      activeId={state.activeHeadingId}
      className="lg:hidden"
      headings={meta.body.headings}
      jump={meta.selection.jump}
    />
  );
};

/** The reference's first prose paragraph. */
const Description = () => {
  const { meta } = useReader();

  return <p className="text-muted-foreground">{meta.article.description}</p>;
};

/** The same sentence outside the prose column, for B and C. */
const DescriptionLede = () => {
  const { meta } = useReader();

  return (
    <p className="text-base/7 text-pretty text-muted-foreground">
      {meta.article.description}
    </p>
  );
};

const Body = () => {
  const { meta } = useReader();

  return <PrototypeArticleBody blocks={meta.body.blocks} />;
};

const Meta = ({ className }: { readonly className?: string }) => {
  const { meta } = useReader();

  return (
    <ArticleMeta
      className={className}
      state={meta.selection.state}
      tags={meta.article.tags}
    />
  );
};

/**
 * The lined band B and C put under the title.
 *
 * `gap-2` against `py-4`: the two rows have to sit closer to each other than
 * either sits to the rules, or the band reads as three unrelated lines. At
 * `gap-3` the inner and outer distances were near enough to be ambiguous.
 */
const MetaBand = () => (
  <div className="screen-line-bottom flex flex-col gap-2 px-4 py-4">
    <DescriptionLede />
    <Meta />
  </div>
);

/**
 * The prose column has to open 32 px under the rule above it — the reference's
 * distance — whatever block happens to come first.
 *
 * Finding 6 read the 52 px hole as `py-4` and `pt-8` stacking. It is not. The
 * padding is right; the extra 20 px is the first paragraph's own top margin,
 * which `.typeset` normally cancels — but its rule only reaches two levels
 * (`> :first-child > :first-child`), and in B and C the paragraph sits three
 * deep, behind the body wrapper. So the column carries the correction itself:
 * `pt-3` where the prose opens the column, and the full `pt-8` where the
 * marginless "On this page" card does. The card is `lg:hidden` and only exists
 * off the `toc=toolbar` setting, so which case applies is a function of the
 * width and the `toc` axis, not of the variant.
 *
 * A needs none of this: its description *is* `.typeset`'s first child, so the
 * reset already reaches it. **For the specification, the prose column should own
 * its opening offset outright** rather than depending on how deep the first
 * paragraph happens to be nested.
 */
const PROSE_OPENS_ON_TEXT_UNLESS_CARD = cn(
  "has-[>div:only-child]:pt-3",
  "lg:pt-3"
);

const Title = () => {
  const { meta } = useReader();

  return <ReaderTitle>{meta.article.title}</ReaderTitle>;
};

/** Fixture neighbours have no route, so activating one says so instead. */
const FixtureNotice = () => {
  const { state } = useReader();

  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-16 z-50 flex justify-center px-4 transition-opacity duration-200",
        state.notice === null ? "opacity-0" : "opacity-100"
      )}
    >
      <p className="rounded-lg bg-popover px-3 py-1.5 font-mono text-xs text-popover-foreground shadow-md ring-1 ring-border">
        {state.notice ?? ""}
      </p>
    </div>
  );
};

/** The action cluster on the right of the toolbar, in reference order. */
const ToolbarActions = () => (
  <div className="flex shrink-0 items-center gap-2">
    <FocusToggle />
    <ToolbarToc />
    <Share />
    <Neighbours />
  </div>
);

/**
 * C's toolbar: every action follows the reader down the page.
 *
 * The back control names the destination and never changes — naming it after
 * the Article put the title on screen twice and made a back control claim it
 * would go somewhere it does not. The title is a separate element that fades in
 * beside it once the real title has slid under the bar, so the top of the page
 * says the title once and the rest of the page still says which Article this is.
 *
 * The title keeps its slot at every scroll position — `flex-1` whether it is
 * showing or not — so the action cluster never shifts as it appears. It is
 * `aria-hidden` while invisible: `opacity-0` still reaches assistive
 * technology, and while it is invisible the `h1` is on screen saying the same
 * thing.
 */
const StickyToolbar = () => {
  const { meta } = useReader();
  const titleBehindChrome = useTitleBehindChrome();
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div
      className={cn(
        "sticky top-12 z-40 bg-background/85 backdrop-blur transition-opacity duration-300",
        "in-data-[chrome=dim]:opacity-25 in-data-[chrome=dim]:focus-within:opacity-100 in-data-[chrome=dim]:hover:opacity-100 in-data-[chrome=hide]:hidden"
      )}
    >
      <ReaderRail className="screen-line-bottom flex items-center gap-2 p-2 pl-4">
        {/* Equal `flex-1 basis-0` shoulders are what centre the title on the
            bar, rather than in whatever space the back link happens to leave
            over. Where the bar is too narrow for that — a long title at 390 px
            — the shoulders bottom out at their content widths, the title
            truncates, and it drifts off centre instead of colliding with
            either side. */}
        <div className="flex flex-1 basis-0 justify-start">
          <BackToBlog />
        </div>

        <p
          aria-hidden={!titleBehindChrome}
          className={cn(
            "min-w-0 truncate text-center text-sm font-medium",
            reducedMotion
              ? "transition-none"
              : "transition-opacity duration-200",
            titleBehindChrome ? "opacity-100" : "opacity-0"
          )}
        >
          {meta.article.title}
        </p>

        <div className="flex flex-1 basis-0 justify-end">
          <ToolbarActions />
        </div>
      </ReaderRail>
    </div>
  );
};

const ReaderShell = ({ children }: { readonly children: React.ReactNode }) => {
  const { actions, meta, state } = useReader();

  useNeighbourHotkeys({
    announce: actions.announceNeighbour,
    next: meta.next,
    previous: meta.previous,
  });

  return (
    <ReaderRoot className="flex flex-1 flex-col" data-chrome={state.chrome}>
      <FixtureNotice />
      {children}
    </ReaderRoot>
  );
};

/**
 * A — Reference-strict. The rail, action row and title are the reference's; the
 * description, dates, Tags and Draft state live in the prose, which is where the
 * reference puts its description.
 */
export const ReferenceStrictReader = () => (
  <ReaderShell>
    <ReaderRail>
      <ReaderTopLine />

      <ReaderActionRow>
        <BackToBlog />
        <ToolbarActions />
      </ReaderActionRow>

      <ReaderTitleSpacer />
      <Title />
    </ReaderRail>

    <ReaderGrid>
      <ReaderGutter />

      <ReaderRail>
        {/* A opens on the description, which is `.typeset`'s own first child,
            so its leading margin is already reset and `pt-8` is already 32 px. */}
        <ProseColumn>
          <Description />
          <Meta className="not-typeset -mt-2" />
          <InlineToc />
          <div>
            <Body />
          </div>
        </ProseColumn>

        <Pager />
        <ReaderBottomLine />
      </ReaderRail>

      <GutterToc />
    </ReaderGrid>
  </ReaderShell>
);

/**
 * B — Lined meta header. The metadata gets its own lined band under the title,
 * so the prose starts on prose, and previous/next becomes a titled pager at the
 * end instead of two icons in the toolbar.
 */
export const LinedMetaReader = () => (
  <ReaderShell>
    <ReaderRail>
      <ReaderTopLine />

      <ReaderActionRow>
        <BackToBlog />
        <ToolbarActions />
      </ReaderActionRow>

      <ReaderTitleSpacer />
      <Title />

      <MetaBand />
    </ReaderRail>

    <ReaderGrid>
      <ReaderGutter />

      <ReaderRail>
        <ProseColumn className={PROSE_OPENS_ON_TEXT_UNLESS_CARD}>
          <InlineToc />
          <div>
            <Body />
          </div>
        </ProseColumn>

        <Pager />
        <ReaderBottomLine />
      </ReaderRail>

      <GutterToc />
    </ReaderGrid>
  </ReaderShell>
);

/**
 * C — Sticky reader toolbar. No gutter minimap: the Article title and every
 * action follow the reader down the page, and the heading list is a toolbar
 * popover that behaves the same at 390 px and 1280 px.
 */
export const StickyToolbarReader = () => (
  <ReaderShell>
    <ReaderRail>
      <ReaderTopLine />
    </ReaderRail>

    <StickyToolbar />

    <ReaderRail>
      {/* The toolbar's own bottom rule is this strip's top rule. */}
      <ReaderTitleSpacer className="screen-line-top-none" />
      <Title />

      <MetaBand />
    </ReaderRail>

    <ReaderGrid>
      <ReaderGutter />

      <ReaderRail>
        <ProseColumn className={PROSE_OPENS_ON_TEXT_UNLESS_CARD}>
          {/* Nothing at C's default, where the toolbar popover already works at
              every width. Only reachable by moving the `toc` axis. */}
          <InlineToc />
          <div>
            <Body />
          </div>
        </ProseColumn>

        <Pager />
        <ReaderBottomLine />
      </ReaderRail>

      <GutterToc />
    </ReaderGrid>
  </ReaderShell>
);
