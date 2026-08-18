// Transposed from ncdai/chanhdai.com @ 83e0b842 (MIT, © Chánh Đại).
// Share URL is rendering input, never `window.location`: preview origin, fragment, and leftover query must not leak.

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
  readonly canonicalUrl: string;
  readonly title: string;
}

// A cancelled native share is not in here: cancelling is a decision, not a failure.
type ShareStatus = "copied" | "copy-failed" | "idle" | "share-failed";

// Same window as CopyButton.
const STATUS_RESET_MS = 1500;

const STATUS_ANNOUNCEMENT = {
  copied: "Copied",
  "copy-failed": "Copy failed",
  idle: "",
  "share-failed": "Sharing failed",
} satisfies Record<ShareStatus, string>;

// Feedback lands on the control the reader used, so the menu needs neither an extra row nor a toast.
type CopyState = Extract<ShareStatus, "copied" | "copy-failed" | "idle">;
type NativeState = Extract<ShareStatus, "idle" | "share-failed">;

interface ShareItemContent {
  readonly icon: typeof LinkIcon;
  readonly label: string;
}

const COPY_ITEM = {
  copied: { icon: CheckIcon, label: "Copied" },
  "copy-failed": { icon: CircleXIcon, label: "Copy failed" },
  idle: { icon: LinkIcon, label: "Copy link" },
} satisfies Record<CopyState, ShareItemContent>;

const NATIVE_ITEM = {
  idle: { icon: EllipsisIcon, label: "More sharing options…" },
  "share-failed": { icon: CircleXIcon, label: "Sharing failed" },
} satisfies Record<NativeState, ShareItemContent>;

// LinkedIn's `share-offsite` endpoint only accepts a URL and opens an empty composer; the feed intent prefills title and URL.
const SHARE_TARGETS = [
  {
    href: (url: string, title: string) =>
      `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    icon: XIcon,
    label: "Share on X",
  },
  {
    href: (url: string, title: string) =>
      `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(`${title} ${url}`)}`,
    icon: LinkedInIcon,
    label: "Share on LinkedIn",
  },
] as const;

const subscribeToNothing = () => () => {
  // A platform does not grow a share sheet while the page is open.
};

// Older desktop browsers ship no `navigator.share`, so the capability is
// feature-detected rather than assumed from the DOM types.
const supportsNativeShare = (
  nav: Navigator
): nav is Navigator & { share: (data: ShareData) => Promise<void> } =>
  typeof nav.share === "function";

// `useSyncExternalStore` rather than an effect: the trigger is server-rendered, the server has no platform to ask, and the capability never changes for the document lifetime.
const useNativeShare = (): boolean =>
  useSyncExternalStore(
    subscribeToNothing,
    () => supportsNativeShare(navigator),
    () => false
  );

// `key` makes the icon a swap rather than a mutation of one element.
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

// Reproduces CopyButton feedback instead of mounting it: a `<button>` inside `role="menuitem"` is two controls.
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
      // A cancelled share sheet is a decision, not a failure.
      if (error instanceof Error && error.name === "AbortError") {
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
    // Non-modal: the trigger lives in a sticky toolbar, and Radix's default
    // modal scroll-lock jumps the page to the top when the menu opens mid-
    // scroll — leaving the menu stranded and the page unclickable under the
    // inert overlay. A share menu does not need to freeze the document.
    <DropdownMenu
      modal={false}
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
