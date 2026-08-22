"use client";

import { useHotkeys } from "@tanstack/react-hotkeys";

import {
  ARTICLE_NEXT_CONTROL,
  ARTICLE_PREVIOUS_CONTROL,
} from "./reader-contract";

// Skip when a menu or dialog is open: Share typeahead, and Radix portals with a role so the input guard doesn't cover them.
const activateNeighbour = (control: string) => {
  if (document.querySelector('[role="dialog"], [role="menu"]') !== null) {
    return;
  }

  document.querySelector<HTMLAnchorElement>(control)?.click();
};

export const ArticleNeighbourHotkeys = () => {
  useHotkeys([
    {
      callback: () => {
        activateNeighbour(ARTICLE_PREVIOUS_CONTROL);
      },
      hotkey: "H",
    },
    {
      callback: () => {
        activateNeighbour(ARTICLE_NEXT_CONTROL);
      },
      hotkey: "L",
    },
  ]);

  return null;
};
