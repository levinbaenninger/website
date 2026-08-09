"use client";

// Twoslash type information, as a real popover.
//
// The types themselves are build-time and deterministic: `code.ts` runs the
// twoslasher during compilation, and this module renders markup that already
// exists. Nothing here calls TypeScript, ever, at read time.
//
// An incidental hover is the only thing that becomes a popover. Because a
// popover is portalled it is client-only — `createPortal` does not server-render
// — so anything an author asked to be *shown* must not be one: an explicit `^?`
// query and an expected-error diagnostic stay static code under the line they
// belong to, visible with no JavaScript at all. `code.ts` gets that by compiling
// with `queryRendering: "line"`.
//
// The compiler splits Twoslash's own `.twoslash-hover` markup into three named
// elements — `twoslash-hover`, `twoslash-popup` and `twoslash-trigger` — and the
// three coordinate through context. None of them reads `props.children`: across
// the server/client boundary a child is an unresolved lazy reference during SSR
// and an element after hydration, so routing children by inspection renders one
// tree on the server and a different one on the client.
//
// Four input modes, one state machine:
//
//   - a fine pointer previews on hover and a keyboard previews on focus;
//   - a click or a tap pins, which is the only way a coarse pointer can read a
//     popup at all, and the only way a pointer user can move into one;
//   - Escape dismisses, from anywhere, because the popup is a dismissable layer;
//   - at most one popup stays pinned per CodeBlock, so a long example cannot end
//     up under a stack of overlapping cards.
//
// The popup is portalled. The prototype instead un-clipped the scrolling `pre`
// while a token was hovered, because it had no portal to reach for; a portal is
// what actually takes the popup outside the code scroller, and it is what makes
// collision handling against the viewport possible rather than against the
// frame.

import { Popover as PopoverPrimitive } from "radix-ui";
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ComponentPropsWithoutRef, ReactNode, RefObject } from "react";

interface ArticleTwoslashScopeValue {
  readonly pinnedId: string | null;
  readonly toggle: (id: string) => void;
  readonly unpin: (id: string) => void;
}

interface ArticleTwoslashHoverValue {
  readonly contentId: string;
  readonly dismiss: () => void;
  readonly hostRef: RefObject<HTMLSpanElement | null>;
  readonly open: boolean;
  readonly preview: (previewing: boolean) => void;
  readonly togglePinned: () => void;
}

type InteractOutsideHandler = NonNullable<
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>["onInteractOutside"]
>;

const ArticleTwoslashScopeContext =
  createContext<ArticleTwoslashScopeValue | null>(null);
const ArticleTwoslashHoverContext =
  createContext<ArticleTwoslashHoverValue | null>(null);

const useTwoslashHover = (componentName: string): ArticleTwoslashHoverValue => {
  const context = useContext(ArticleTwoslashHoverContext);
  if (context === null) {
    throw new Error(
      `${componentName} must be rendered inside a Twoslash token.`
    );
  }
  return context;
};

/**
 * The one-pinned-popup-per-CodeBlock boundary.
 *
 * It is rendered by the server-side `ArticleCodeBlock` as a client leaf around
 * server-rendered children, the same shape the Article body uses for its
 * canonical URL. A Twoslash token outside any CodeBlock cannot occur, but the
 * absent scope is still handled: it simply pins nothing globally.
 */
export const ArticleTwoslashScope = ({
  children,
}: {
  readonly children: ReactNode;
}) => {
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  /*
   * Both writes are functional, and that is load-bearing rather than a habit.
   * Clicking a second token dismisses the first popup and pins the second in the
   * same gesture, in that order — so a `dismiss` reading the pinned id it
   * captured at render time unpins a token that is no longer the pinned one and
   * closes the popup the click just opened. `unpin` can only clear its own pin.
   */
  const toggle = useCallback((id: string) => {
    setPinnedId((current) => (current === id ? null : id));
  }, []);
  const unpin = useCallback((id: string) => {
    setPinnedId((current) => (current === id ? null : current));
  }, []);
  const value = useMemo<ArticleTwoslashScopeValue>(
    () => ({ pinnedId, toggle, unpin }),
    [pinnedId, toggle, unpin]
  );

  return (
    <ArticleTwoslashScopeContext value={value}>
      {children}
    </ArticleTwoslashScopeContext>
  );
};

export const ArticleTwoslashHover = ({
  children,
  className,
}: ComponentPropsWithoutRef<"span">) => {
  const scope = useContext(ArticleTwoslashScopeContext);
  const id = useId();
  const contentId = `${id}-popup`;
  const [previewing, setPreviewing] = useState(false);
  const hostRef = useRef<HTMLSpanElement>(null);
  const pinned = scope?.pinnedId === id;
  const open = pinned || previewing;

  const value = useMemo<ArticleTwoslashHoverValue>(
    () => ({
      contentId,
      dismiss: () => {
        setPreviewing(false);
        scope?.unpin(id);
      },
      hostRef,
      open,
      preview: setPreviewing,
      togglePinned: () => {
        setPreviewing(false);
        scope?.toggle(id);
      },
    }),
    [contentId, id, open, scope]
  );

  return (
    <PopoverPrimitive.Root open={open}>
      <ArticleTwoslashHoverContext value={value}>
        <span className={className} data-twoslash-hover="" ref={hostRef}>
          {children}
        </span>
      </ArticleTwoslashHoverContext>
    </PopoverPrimitive.Root>
  );
};

/*
 * The trigger is a real button, not a span with a handler. It opens a popover,
 * which is a button's job, and it is what gives the token a tab stop, a visible
 * focus ring and an announced expanded state at no cost.
 *
 * Radix's own `Popover.Trigger` is deliberately not used. Its click handler
 * toggles `open`, and `open` here is `pinned || previewing` — so clicking a
 * token that is already previewing under the pointer would read as "close"
 * when the reader means "pin". `Popover.Anchor` gives the same positioning
 * without the opinion, and the ARIA the trigger would have contributed is
 * stated outright.
 */
export const ArticleTwoslashTrigger = ({
  children,
  className,
}: ComponentPropsWithoutRef<"span">) => {
  const { contentId, open, preview, togglePinned } = useTwoslashHover(
    "ArticleTwoslashTrigger"
  );

  return (
    <PopoverPrimitive.Anchor asChild>
      <button
        aria-controls={open ? contentId : undefined}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={className}
        data-state={open ? "open" : "closed"}
        data-twoslash-trigger=""
        onBlur={() => {
          preview(false);
        }}
        onClick={togglePinned}
        onFocus={() => {
          preview(true);
        }}
        onPointerEnter={(event) => {
          // A coarse pointer synthesises enter/leave around a tap; previewing
          // on it would open and immediately close the popup it just pinned.
          if (event.pointerType === "mouse") {
            preview(true);
          }
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") {
            preview(false);
          }
        }}
        type="button"
      >
        {children}
      </button>
    </PopoverPrimitive.Anchor>
  );
};

export const ArticleTwoslashPopup = ({
  children,
  className,
}: ComponentPropsWithoutRef<"span">) => {
  const { contentId, dismiss, hostRef } = useTwoslashHover(
    "ArticleTwoslashPopup"
  );

  /*
   * The trigger sits outside the popup, so pressing it *is* an outside
   * interaction — and Radix dispatches that notification after the click has
   * already pinned. Dismissing on it would close the popup the same gesture
   * just opened, so an interaction inside this token's own markup is refused
   * rather than handled, and the trigger's own click decides what happens.
   */
  const dismissOutside: InteractOutsideHandler = (event) => {
    const { target } = event.detail.originalEvent;
    if (target instanceof Node && hostRef.current?.contains(target) === true) {
      event.preventDefault();
      return;
    }
    dismiss();
  };

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align="start"
        className={className}
        collisionPadding={16}
        data-article-twoslash-popup=""
        id={contentId}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
        onEscapeKeyDown={dismiss}
        onInteractOutside={dismissOutside}
        /*
         * A preview must not move the caret. Focus stays on the token, which is
         * also what lets Escape reach the layer and what keeps a synchronised or
         * incidental open from stealing a reader's place in the Article.
         */
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
        side="bottom"
        sideOffset={6}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
};
