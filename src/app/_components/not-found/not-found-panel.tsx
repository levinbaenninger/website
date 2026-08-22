"use client";

import { useMotionValue } from "motion/react";
import Link from "next/link";
import { useState } from "react";

import {
  NOT_FOUND_COPY,
  orderRecoveryDestinations,
  selectNotFoundVariant,
} from "@/app/_config/not-found";
import { useHotkeyLabel } from "@/shared/hotkeys/use-hotkey-label";
import { Button } from "@/shared/ui/button";
import { Kbd, KbdGroup } from "@/shared/ui/kbd";
import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/shared/ui/panel";

import { PEN_PARK_POINT } from "./digits";
import { PlotterFigure } from "./plotter-figure";
import { StatusStrip } from "./status-strip";
import { truncatePath } from "./truncate-path";

const UNRESOLVED_PATH = "—";

/**
 * Static 404 prerenders as `/_not-found`; `path` is null until hydration.
 */
export const NotFoundPanel = ({ path }: { path: string | null }) => {
  const modifierLabel = useHotkeyLabel("mod");
  const keyLabel = useHotkeyLabel("k");
  const [plotToken, setPlotToken] = useState(0);
  const penX = useMotionValue(PEN_PARK_POINT.x);
  const penY = useMotionValue(PEN_PARK_POINT.y);

  const variant = selectNotFoundVariant(path ?? "");
  const copy = NOT_FOUND_COPY[variant];

  return (
    <Panel className="mx-auto w-full md:w-3xl">
      <figure className="screen-line-bottom relative p-4">
        <PlotterFigure penX={penX} penY={penY} plotToken={plotToken} />
        <figcaption className="pointer-events-none absolute right-2 bottom-2 font-mono text-xs leading-none text-zinc-400 select-none sm:right-4 dark:text-zinc-700">
          ERR_404
        </figcaption>
      </figure>

      <StatusStrip
        onReplot={() => {
          setPlotToken((token) => token + 1);
        }}
        path={path === null ? UNRESOLVED_PATH : truncatePath(path)}
        penX={penX}
        penY={penY}
      />

      <PanelHeader>
        <PanelTitle asChild>
          <h1>{copy.title}</h1>
        </PanelTitle>
        <PanelDescription>{copy.description}</PanelDescription>
      </PanelHeader>

      <PanelContent className="flex flex-wrap items-center gap-3">
        {orderRecoveryDestinations(variant).map((destination) => (
          <Button asChild key={destination.href} variant="outline">
            <Link href={destination.href}>
              {destination.icon}
              {destination.title}
            </Link>
          </Button>
        ))}

        {path === null ? null : (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            or press
            <KbdGroup>
              <Kbd>{modifierLabel}</Kbd>
              <Kbd>{keyLabel}</Kbd>
            </KbdGroup>
            to search
          </span>
        )}
      </PanelContent>
    </Panel>
  );
};
