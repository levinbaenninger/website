"use client";

import { useHotkeys } from "@tanstack/react-hotkeys";

import {
  ARTICLE_NEXT_CONTROL,
  ARTICLE_PREVIOUS_CONTROL,
} from "./reader-contract";

/**
 * Clicks a neighbour control, unless something is layered over the Article.
 *
 * An open menu or dialog owns the keyboard while it is up: the Share menu
 * gives `h` a typeahead meaning of its own, and a visitor who opened it did
 * not ask to leave the Article. Radix portals both into the body with a role,
 * which is what makes them findable from here, and neither is a text field, so
 * the library's own input guard does not cover this case.
 */
const activateNeighbour = (control: string) => {
  if (document.querySelector('[role="dialog"], [role="menu"]') !== null) {
    return;
  }

  document.querySelector<HTMLAnchorElement>(control)?.click();
};

/**
 * Vim's `h` and `l` for the neighbouring Articles.
 *
 * Every navigation they perform is already on screen as the toolbar arrows and
 * the end pager, so they are a shortcut and never the only way through: the
 * toolbar tooltips name the key the way the theme toggle names `D`.
 *
 * `h` and `l` are the horizontal half of Vim's home row, so they take the
 * direction the toolbar arrows point rather than the direction of time: `h` is
 * Previous and `l` is Next in the exact catalog order the pager names.
 *
 * A key clicks the toolbar's own anchor rather than pushing a route of its
 * own. That is the coupling this island accepts — it depends on a control the
 * server rendered, found by attribute the way the sticky title finds the `h1`
 * — and it is what buys the rest: the scroll to the top of the destination,
 * the history entry, and the toolbar's own no-prefetch policy are whatever the
 * `Link` does, not a second opinion about it. At a collection boundary the
 * chrome renders no anchor, the query finds nothing, and the key does nothing,
 * which is the same answer the missing control gives a mouse.
 *
 * The island renders nothing and needs no props: the navigation it performs is
 * already in the DOM. Typing needs no guard of its own — single-key hotkeys
 * are ignored when the event comes from a text input, a textarea or a
 * contenteditable element, so `h` reaches the command menu's field and the
 * catalog search, not this island.
 */
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
