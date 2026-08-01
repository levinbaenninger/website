// PROTOTYPE — throwaway. Delete this directory once issue #34 is decided.
//
// Floating language/axis bar. Deliberately unlike the design under it, and never
// rendered in a production build.
//
// `[` and `]` step the language, matching the reader prototype from #33 so both
// bars behave the same way.

"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/shared/ui/button";

import type { LanguageSelection } from "./params";
import {
  COPY_REVEALS,
  HEADING_ANCHORS,
  LANGUAGES,
  MOTION_MODES,
  SPECIMENS,
  toLanguageQuery,
} from "./params";

type AxisKey = Exclude<keyof LanguageSelection, "language">;

interface Axis {
  readonly key: AxisKey;
  readonly label: string;
  readonly values: readonly string[];
}

const AXES: readonly Axis[] = [
  { key: "specimen", label: "specimen", values: SPECIMENS },
  { key: "anchor", label: "anchor", values: HEADING_ANCHORS },
  { key: "copy", label: "copy", values: COPY_REVEALS },
  { key: "motion", label: "motion", values: MOTION_MODES },
];

const cycle = <T,>(values: readonly T[], current: T, offset: number): T => {
  const index = values.indexOf(current);
  const next = values[(index + offset + values.length) % values.length];
  return next ?? current;
};

export const PrototypeSwitcher = (selection: LanguageSelection) => {
  const router = useRouter();
  const pathname = usePathname();

  const go = (patch: Partial<LanguageSelection>) => {
    const next = { ...selection, ...patch };
    router.replace(`${pathname}?${toLanguageQuery(next)}`, { scroll: false });
  };

  const stepLanguage = (offset: number) => {
    const keys = LANGUAGES.map((entry) => entry.key);
    go({ language: cycle(keys, selection.language, offset) });
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
        stepLanguage(-1);
      }
      if (event.key === "]") {
        stepLanguage(1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  });

  const current = LANGUAGES.find((entry) => entry.key === selection.language);

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 md:bottom-4 print:hidden">
      <div className="flex max-w-[min(48rem,100%)] flex-col items-center gap-2 rounded-xl border border-foreground/20 bg-background/95 p-2 shadow-lg backdrop-blur">
        <div className="flex items-center gap-1">
          <Button
            aria-label="Previous language"
            onClick={() => {
              stepLanguage(-1);
            }}
            size="icon"
            variant="ghost"
          >
            <ChevronLeftIcon aria-hidden />
          </Button>

          <span className="min-w-56 text-center font-mono text-xs">
            {selection.language.toUpperCase()} — {current?.name}
          </span>

          <Button
            aria-label="Next language"
            onClick={() => {
              stepLanguage(1);
            }}
            size="icon"
            variant="ghost"
          >
            <ChevronRightIcon aria-hidden />
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-1">
          {AXES.map((axis) => (
            <Button
              className="h-7 gap-1.5 px-2 font-mono text-xs"
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
          [ ] language · click cycles an axis, shift-click reverses
        </p>
      </div>
    </div>
  );
};
