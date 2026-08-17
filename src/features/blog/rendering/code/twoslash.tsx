"use client";

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

// One pinned popup per CodeBlock. Missing scope pins nothing globally.
export const ArticleTwoslashScope = ({
  children,
}: {
  readonly children: ReactNode;
}) => {
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  // Functional setState: pin/unpin of a second token happens in the same
  // gesture, so a dismiss captured at render time would unpin the new pin.
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

// Real button for a tab stop and expanded state. Don't use Radix Trigger: its
// click toggles `open`, and `open` here is `pinned || previewing`, so clicking a
// previewing token would close instead of pin.
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

  // The trigger sits outside the popup, so pressing it is an outside
  // interaction. Don't dismiss on it: Radix fires that after the click has
  // already pinned, which would close the popup the same gesture just opened.
  const dismissOutside: InteractOutsideHandler = (event) => {
    const { target } = event.detail.originalEvent;
    if (target instanceof Node && hostRef.current?.contains(target) === true) {
      event.preventDefault();
      return;
    }
    dismiss();
  };

  // Portal takes the popup outside the code scroller so collision is against the viewport, not the frame.
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
        // A preview must not steal focus: caret stays on the token so Escape
        // still reaches the layer.
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
