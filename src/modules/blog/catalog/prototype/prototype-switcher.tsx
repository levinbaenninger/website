// PROTOTYPE — throwaway. Delete this directory once issue #32 is decided.
//
// Floating variant/state bar. Deliberately unlike the design under it, and
// never rendered in a production build.

"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/shared/ui/button";

import type {
  Alignment,
  CardLayout,
  PrototypeState,
  SnippetMode,
  VariantKey,
} from "./params";
import {
  ALIGNMENTS,
  CARD_LAYOUTS,
  PROTOTYPE_STATES,
  SNIPPET_MODES,
  VARIANTS,
} from "./params";

const STATE_LABEL: Record<PrototypeState, string> = {
  default: "Default",
  error: "Search error",
  loading: "Loading",
  "no-results": "No results",
  zero: "Zero articles",
};

const ALIGNMENT_LABEL: Record<Alignment, string> = {
  "clamp-2": "Clamp 2 lines",
  "meta-bottom": "Meta at bottom",
  natural: "Natural flow",
  "reserve-2": "Reserve 2 lines",
};

const SNIPPET_LABEL: Record<SnippetMode, string> = {
  always: "Prose always",
  conditional: "Prose when searching",
  never: "No prose",
};

const CARD_LAYOUT_LABEL: Record<CardLayout, string> = {
  inline: "Date + tags one line",
  "no-tags": "No tags on card",
  stacked: "Tags below date",
};

interface SwitcherSelection {
  readonly alignment: Alignment;
  readonly cardLayout: CardLayout;
  readonly snippetMode: SnippetMode;
  readonly state: PrototypeState;
  readonly variant: VariantKey;
}

export const PrototypeSwitcher = ({
  alignment,
  cardLayout,
  snippetMode,
  state,
  variant,
}: SwitcherSelection) => {
  const router = useRouter();
  const pathname = usePathname();
  const selection: SwitcherSelection = {
    alignment,
    cardLayout,
    snippetMode,
    state,
    variant,
  };

  const go = (patch: Partial<SwitcherSelection>) => {
    const next = { ...selection, ...patch };
    router.replace(
      `${pathname}?variant=${next.variant}&state=${next.state}&align=${next.alignment}&snippet=${next.snippetMode}&card=${next.cardLayout}`,
      { scroll: false }
    );
  };

  const step = (offset: number) => {
    const index = VARIANTS.findIndex((entry) => entry.key === variant);
    const next = VARIANTS[(index + offset + VARIANTS.length) % VARIANTS.length];
    if (next !== undefined) {
      go({ variant: next.key });
    }
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
      if (event.key === "ArrowLeft") {
        step(-1);
      }
      if (event.key === "ArrowRight") {
        step(1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  });

  const current = VARIANTS.find((entry) => entry.key === variant);

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 print:hidden">
      <div className="flex flex-col items-center gap-2 rounded-xl border border-foreground/20 bg-background/95 p-2 shadow-lg backdrop-blur">
        <div className="flex items-center gap-1">
          <Button
            aria-label="Previous variant"
            onClick={() => {
              step(-1);
            }}
            size="icon"
            variant="ghost"
          >
            <ChevronLeftIcon aria-hidden />
          </Button>

          <span className="min-w-52 text-center font-mono text-xs">
            {variant.toUpperCase()} — {current?.name}
          </span>

          <Button
            aria-label="Next variant"
            onClick={() => {
              step(1);
            }}
            size="icon"
            variant="ghost"
          >
            <ChevronRightIcon aria-hidden />
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-1">
          {PROTOTYPE_STATES.map((entry) => (
            <Button
              className="h-7 px-2 font-mono text-xs"
              key={entry}
              onClick={() => {
                go({ state: entry });
              }}
              size="sm"
              variant={entry === state ? "default" : "outline"}
            >
              {STATE_LABEL[entry]}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-1">
          {ALIGNMENTS.map((entry) => (
            <Button
              className="h-7 px-2 font-mono text-xs"
              disabled={variant !== "b"}
              key={entry}
              onClick={() => {
                go({ alignment: entry });
              }}
              size="sm"
              variant={entry === alignment ? "default" : "outline"}
            >
              {ALIGNMENT_LABEL[entry]}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-1">
          {SNIPPET_MODES.map((entry) => (
            <Button
              className="h-7 px-2 font-mono text-xs"
              disabled={variant !== "b"}
              key={entry}
              onClick={() => {
                go({ snippetMode: entry });
              }}
              size="sm"
              variant={entry === snippetMode ? "default" : "outline"}
            >
              {SNIPPET_LABEL[entry]}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-1">
          {CARD_LAYOUTS.map((entry) => (
            <Button
              className="h-7 px-2 font-mono text-xs"
              disabled={variant !== "b"}
              key={entry}
              onClick={() => {
                go({ cardLayout: entry });
              }}
              size="sm"
              variant={entry === cardLayout ? "default" : "outline"}
            >
              {CARD_LAYOUT_LABEL[entry]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
