"use client";

import { CheckIcon, CircleXIcon, CopyIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ComponentProps, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { clickSoftSound } from "@/shared/audio/sounds/click-soft";
import { useSound } from "@/shared/audio/use-sound";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/ui/cn";

type CopyState = "idle" | "done" | "error";

export type CopyButtonProps = Omit<
  ComponentProps<typeof Button>,
  "children"
> & {
  /** The text to copy, resolved when the button is clicked. */
  text: string | (() => string);
  idleIcon?: ReactNode;
};

const stateLabel: Record<CopyState, string> = {
  idle: "",
  done: "Copied",
  error: "Copy failed",
};

export const CopyButton = ({
  className,
  size = "icon-sm",
  text,
  idleIcon,
  onClick,
  ...props
}: CopyButtonProps) => {
  const [state, setState] = useState<CopyState>("idle");
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const [playFeedback] = useSound(clickSoftSound, {
    interrupt: true,
    volume: 0.3,
  });

  useEffect(
    () => () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    },
    []
  );

  const copyText = useCallback(async () => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    // Start audio inside the user gesture so browsers allow playback.
    playFeedback();

    try {
      const copiedText = typeof text === "function" ? text() : text;
      await navigator.clipboard.writeText(copiedText);

      setState("done");
      navigator.vibrate?.(10);
    } catch {
      setState("error");
      navigator.vibrate?.([20, 40, 20]);
    } finally {
      resetTimeoutRef.current = setTimeout(() => {
        setState("idle");
      }, 1500);
    }
  }, [playFeedback, text]);

  const icon = {
    idle: idleIcon ?? <CopyIcon aria-hidden data-slot="idle-icon" />,
    done: <CheckIcon aria-hidden data-slot="done-icon" />,
    error: <CircleXIcon aria-hidden data-slot="error-icon" />,
  }[state];

  return (
    <Button
      className={cn("will-change-transform", className)}
      data-slot="copy-button"
      data-state={state}
      size={size}
      aria-label="Copy"
      onClick={(event) => {
        void copyText();
        onClick?.(event);
      }}
      {...props}
    >
      {shouldReduceMotion === true ? (
        <span key={state} className="inline-flex">
          {icon}
        </span>
      ) : (
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={state}
            className="inline-flex"
            initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
            transition={{ type: "spring", duration: 0.25, bounce: 0 }}
          >
            {icon}
          </motion.span>
        </AnimatePresence>
      )}
      <output className="sr-only" aria-live="polite">
        {stateLabel[state]}
      </output>
    </Button>
  );
};
