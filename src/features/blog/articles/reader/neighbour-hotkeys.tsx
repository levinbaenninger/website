"use client";

import { useHotkeys } from "@tanstack/react-hotkeys";

import {
  ARTICLE_NEXT_CONTROL,
  ARTICLE_PREVIOUS_CONTROL,
} from "./reader-contract";

// Skip when a menu or dialog is open: Share gives `h` a typeahead meaning of its own.
// Radix portals both into the body with a role, and neither is a text field, so the library's input guard does not cover this.
const activateNeighbour = (control: string) => {
  if (document.querySelector('[role="dialog"], [role="menu"]') !== null) {
    return;
  }

  document.querySelector<HTMLAnchorElement>(control)?.click();
};

// Clicks the toolbar `Link` rather than pushing a route, so scroll, history, and prefetch stay the Link's.
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
