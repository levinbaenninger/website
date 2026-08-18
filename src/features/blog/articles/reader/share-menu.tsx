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

type ShareStatus = "copied" | "copy-failed" | "idle" | "share-failed";

const STATUS_RESET_MS = 1500;

const STATUS_ANNOUNCEMENT = {
  copied: "Copied",
  "copy-failed": "Copy failed",
  idle: "",
  "share-failed": "Sharing failed",
} satisfies Record<ShareStatus, string>;

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

const supportsNativeShare = (
  nav: Navigator
): nav is Navigator & { share: (data: ShareData) => Promise<void> } =>
  typeof nav.share === "function";

const useNativeShare = (): boolean =>
  useSyncExternalStore(
    subscribeToNothing,
    () => supportsNativeShare(navigator),
    () => false
  );

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
    // Non-modal: Radix modal scroll-lock jumps the page when this sticky trigger opens mid-scroll.
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
          <ShareIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>

      <output aria-live="polite" className="sr-only">
        {STATUS_ANNOUNCEMENT[status]}
      </output>

      <DropdownMenuContent align="end" className="w-48" sideOffset={8}>
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(event) => {
            // Menu stays open so the success state isn't taken with it.
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
