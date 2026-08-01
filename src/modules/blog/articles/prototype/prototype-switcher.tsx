// PROTOTYPE — throwaway. Delete this directory once issue #33 is decided.
//
// Floating variant/axis bar. Deliberately unlike the design under it, and never
// rendered in a production build.
//
// The reader claims ← and → for previous/next Article, so variants step with
// [ and ] here instead.

"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/ui/cn";

import type { PrototypeSelection } from "./params";
import {
  ARTICLE_STATES,
  CONTENT_SHAPES,
  FOCUS_MODES,
  NEIGHBOURHOODS,
  PAGER_PLACEMENTS,
  SHARE_SURFACES,
  TOC_JUMPS,
  TOC_REVEALS,
  toPrototypeQuery,
  VARIANTS,
} from "./params";

type AxisKey = Exclude<keyof PrototypeSelection, "variant">;

interface Axis {
  readonly disabled: boolean;
  readonly key: AxisKey;
  readonly label: string;
  readonly values: readonly string[];
}

const cycle = <T,>(values: readonly T[], current: T, offset: number): T => {
  const index = values.indexOf(current);
  const next = values[(index + offset + values.length) % values.length];
  return next ?? current;
};

export const PrototypeSwitcher = (selection: PrototypeSelection) => {
  const router = useRouter();
  const pathname = usePathname();

  const go = (patch: Partial<PrototypeSelection>) => {
    const next = { ...selection, ...patch };
    router.replace(`${pathname}?${toPrototypeQuery(next)}`, { scroll: false });
  };

  const stepVariant = (offset: number) => {
    const keys = VARIANTS.map((entry) => entry.key);
    go({ variant: cycle(keys, selection.variant, offset) });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable]") !== null
      ) {
        return;
      }
      if (event.key === "[") {
        stepVariant(-1);
      }
      if (event.key === "]") {
        stepVariant(1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  });

  const headless = selection.content === "none";

  const axes: readonly Axis[] = [
    { disabled: false, key: "content", label: "body", values: CONTENT_SHAPES },
    { disabled: false, key: "state", label: "state", values: ARTICLE_STATES },
    {
      disabled: false,
      key: "neighbourhood",
      label: "nav",
      values: NEIGHBOURHOODS,
    },
    { disabled: false, key: "pager", label: "pager", values: PAGER_PLACEMENTS },
    { disabled: false, key: "share", label: "share", values: SHARE_SURFACES },
    { disabled: false, key: "focus", label: "focus", values: FOCUS_MODES },
    { disabled: headless, key: "toc", label: "toc", values: TOC_REVEALS },
    { disabled: headless, key: "jump", label: "jump", values: TOC_JUMPS },
  ];

  const current = VARIANTS.find((entry) => entry.key === selection.variant);

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 md:bottom-4 print:hidden">
      <div className="flex max-w-[min(48rem,100%)] flex-col items-center gap-2 rounded-xl border border-foreground/20 bg-background/95 p-2 shadow-lg backdrop-blur">
        <div className="flex items-center gap-1">
          <Button
            aria-label="Previous variant"
            onClick={() => {
              stepVariant(-1);
            }}
            size="icon"
            variant="ghost"
          >
            <ChevronLeftIcon aria-hidden />
          </Button>

          <span className="min-w-56 text-center font-mono text-xs">
            {selection.variant.toUpperCase()} — {current?.name}
          </span>

          <Button
            aria-label="Next variant"
            onClick={() => {
              stepVariant(1);
            }}
            size="icon"
            variant="ghost"
          >
            <ChevronRightIcon aria-hidden />
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-1">
          {axes.map((axis) => (
            <Button
              className={cn(
                "h-7 gap-1.5 px-2 font-mono text-xs",
                axis.disabled && "opacity-40"
              )}
              disabled={axis.disabled}
              key={axis.key}
              onClick={(event) => {
                go({
                  [axis.key]: cycle(
                    axis.values,
                    selection[axis.key],
                    event.shiftKey ? -1 : 1
                  ),
                });
              }}
              size="sm"
              title={`${axis.label}: ${axis.values.join(" → ")} (shift-click reverses)`}
              variant="outline"
            >
              <span className="text-muted-foreground">{axis.label}</span>
              {selection[axis.key]}
            </Button>
          ))}
        </div>

        <p className="font-mono text-[0.625rem] text-muted-foreground">
          [ ] variant · click cycles an axis, shift-click reverses
        </p>
      </div>
    </div>
  );
};
