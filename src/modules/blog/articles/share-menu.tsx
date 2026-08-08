// The Article Share menu.
//
// One control that hands a reader the complete Article: the canonical link on
// the clipboard, an X or LinkedIn intent, or — where the platform has one — the
// native share sheet. Composition accepted on #33 (the reference dropdown),
// behaviour specified on #36. Transposed from ncdai/chanhdai.com @ 83e0b842
// (MIT, © Chánh Đại): `src/features/doc/components/doc-share-menu.tsx`.
//
// The URL is rendering input, never `window.location`: what a reader shares has
// to name the Article on the production origin, not the preview deployment,
// trailing slash, fragment or leftover query parameter the browser happens to
// be showing. `null` is the local Draft case, and the reader mounts no Share
// control at all for it — the same rule the heading section links follow.
//
// Every item's feedback reproduces the shared CopyButton contract — the
// click-soft tick inside the gesture, the vibration, the icon swap that snaps
// under reduced motion, and the polite announcement — rather than mounting the
// component itself: a `<button>` inside a `role="menuitem"` is two controls
// where a menu promises one.

"use client";

import {
  CheckIcon,
  CircleXIcon,
  EllipsisIcon,
  LinkIcon,
  ShareIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { clickSoftSound } from "@/shared/audio/sounds/click-soft";
import { useSound } from "@/shared/audio/use-sound";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { LinkedInIcon } from "@/shared/ui/icons/linkedin-icon";
import { XIcon } from "@/shared/ui/icons/x-icon";

interface ArticleShareMenuProps {
  /** The absolute canonical Article URL. */
  readonly canonicalUrl: string;
  readonly title: string;
}

/**
 * What the menu is currently saying about the last thing a reader asked for.
 *
 * A cancelled native share is not in here: cancelling is a decision, not a
 * failure, and reporting it back would be the interface arguing with it.
 */
type ShareStatus = "copied" | "copy-failed" | "idle" | "share-failed";

/** How long a result stays on screen. The shared CopyButton's own window. */
const STATUS_RESET_MS = 1500;

const STATUS_ANNOUNCEMENT: Record<ShareStatus, string> = {
  copied: "Copied",
  "copy-failed": "Copy failed",
  idle: "",
  "share-failed": "Sharing failed",
};

/**
 * What each item reads as, per state.
 *
 * An item says its own result: the copy item becomes "Copied", the native item
 * becomes "Sharing failed". Feedback that lands on the control a reader used is
 * feedback they do not have to go looking for — and it costs the menu neither a
 * row that appears out of nowhere nor a toast dependency.
 */
type CopyState = Extract<ShareStatus, "copied" | "copy-failed" | "idle">;
type NativeState = Extract<ShareStatus, "idle" | "share-failed">;

const COPY_ITEM: Record<CopyState, { icon: typeof LinkIcon; label: string }> = {
  copied: { icon: CheckIcon, label: "Copied" },
  "copy-failed": { icon: CircleXIcon, label: "Copy failed" },
  idle: { icon: LinkIcon, label: "Copy link" },
};

const NATIVE_ITEM: Record<
  NativeState,
  { icon: typeof LinkIcon; label: string }
> = {
  idle: { icon: EllipsisIcon, label: "More sharing options…" },
  "share-failed": { icon: CircleXIcon, label: "Sharing failed" },
};

/**
 * A web intent per network, each carrying its own mark.
 *
 * X takes the title as the post's text and the URL as the attached card;
 * LinkedIn composes its own preview from the page it is given and ignores any
 * text passed alongside it, so it receives the URL alone.
 */
const SHARE_TARGETS = [
  {
    href: (url: string, title: string) =>
      `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    icon: XIcon,
    label: "Share on X",
  },
  {
    href: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    icon: LinkedInIcon,
    label: "Share on LinkedIn",
  },
] as const;

/**
 * Whether this platform has a native share sheet.
 *
 * Read through `useSyncExternalStore` rather than an effect that sets state:
 * the trigger is server-rendered, the server has no platform to ask, and this
 * is exactly the "server says one thing, client says another" case the hook
 * exists for. The capability never changes for the lifetime of the document, so
 * there is nothing to subscribe to.
 */
const subscribeToNothing = () => () => {
  // A platform does not grow a share sheet while the page is open.
};

const useNativeShare = (): boolean =>
  useSyncExternalStore(
    subscribeToNothing,
    () => typeof navigator.share === "function",
    () => false
  );

/** A share the reader called off, which the interface has nothing to say about. */
const isAbort = (error: unknown): boolean =>
  error instanceof Error && error.name === "AbortError";

/**
 * The icon slot inside a menu item.
 *
 * Mirrors the shared CopyButton: a spring cross-fade normally, a plain swap
 * where motion is unwelcome. `key` is what makes the swap a swap rather than a
 * mutation of one element.
 */
const ItemIcon = ({
  children,
  state,
}: {
  readonly children: React.ReactNode;
  readonly state: string;
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion === true) {
    return (
      <span className="inline-flex" data-slot="share-item-icon" key={state}>
        {children}
      </span>
    );
  }

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.span
        animate={{ filter: "blur(0px)", opacity: 1, scale: 1 }}
        className="inline-flex"
        data-slot="share-item-icon"
        exit={{ filter: "blur(4px)", opacity: 0, scale: 0.5 }}
        initial={{ filter: "blur(4px)", opacity: 0, scale: 0.5 }}
        key={state}
        transition={{ bounce: 0, duration: 0.25, type: "spring" }}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
};

export const ArticleShareMenu = ({
  canonicalUrl,
  title,
}: ArticleShareMenuProps) => {
  const [status, setStatus] = useState<ShareStatus>("idle");
  const canShareNatively = useNativeShare();
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playFeedback] = useSound(clickSoftSound, {
    interrupt: true,
    volume: 0.3,
  });

  useEffect(
    () => () => {
      if (resetTimeoutRef.current !== null) {
        clearTimeout(resetTimeoutRef.current);
      }
    },
    []
  );

  const report = useCallback((next: ShareStatus) => {
    if (resetTimeoutRef.current !== null) {
      clearTimeout(resetTimeoutRef.current);
    }

    setStatus(next);
    resetTimeoutRef.current = setTimeout(() => {
      setStatus("idle");
    }, STATUS_RESET_MS);
  }, []);

  const copyLink = useCallback(async () => {
    // Inside the gesture, so the browser allows the sound to play.
    playFeedback();

    try {
      await navigator.clipboard.writeText(canonicalUrl);
      report("copied");
      navigator.vibrate?.(10);
    } catch {
      report("copy-failed");
      navigator.vibrate?.([20, 40, 20]);
    }
  }, [canonicalUrl, playFeedback, report]);

  const shareNatively = useCallback(async () => {
    playFeedback();

    try {
      await navigator.share({ title, url: canonicalUrl });
    } catch (error) {
      if (isAbort(error)) {
        return;
      }

      report("share-failed");
      navigator.vibrate?.([20, 40, 20]);
    }
  }, [canonicalUrl, playFeedback, report, title]);

  const copyState: CopyState =
    status === "copied" || status === "copy-failed" ? status : "idle";
  const nativeState: NativeState = status === "share-failed" ? status : "idle";
  const CopyStateIcon = COPY_ITEM[copyState].icon;
  const NativeStateIcon = NATIVE_ITEM[nativeState].icon;

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) {
          if (resetTimeoutRef.current !== null) {
            clearTimeout(resetTimeoutRef.current);
          }

          setStatus("idle");
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Share"
          className="size-7 border-none"
          size="icon-sm"
          variant="secondary"
        >
          {/* The box with the arrow leaving it, not the three connected dots:
              it is what a share affordance looks like on every platform. */}
          <ShareIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>

      {/* Outside the menu, and mounted whether or not it is open: a live region
          announces changes made to it, not its own arrival, and a menu that
          brings its own region with it has nothing to compare against. */}
      <output aria-live="polite" className="sr-only">
        {STATUS_ANNOUNCEMENT[status]}
      </output>

      <DropdownMenuContent align="end" className="w-48" sideOffset={8}>
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(event) => {
            // The menu stays open so the item can say what happened. A menu
            // that closes on select takes its own success state with it.
            event.preventDefault();
            void copyLink();
          }}
        >
          <ItemIcon state={copyState}>
            <CopyStateIcon aria-hidden />
          </ItemIcon>
          {COPY_ITEM[copyState].label}
        </DropdownMenuItem>

        {SHARE_TARGETS.map(({ href, icon: Icon, label }) => (
          <DropdownMenuItem asChild className="cursor-pointer" key={label}>
            <a
              href={href(canonicalUrl, title)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Icon aria-hidden />
              {label}
            </a>
          </DropdownMenuItem>
        ))}

        {canShareNatively ? (
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={(event) => {
              event.preventDefault();
              void shareNatively();
            }}
          >
            <ItemIcon state={nativeState}>
              <NativeStateIcon aria-hidden />
            </ItemIcon>
            {NATIVE_ITEM[nativeState].label}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
