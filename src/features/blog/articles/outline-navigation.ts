// Which outline heading a visitor is currently reading, and what happens when
// they pick a different one.

"use client";

import { useEffect, useState } from "react";

import {
  afterArticleLayoutSettles,
  findArticleElement,
  focusArticleElement,
  isArticleElementRevealed,
  revealArticleElement,
} from "@/features/blog/rendering/reveal";

import { STICKY_CHROME_PX } from "./reader-contract";
import type { ArticleOutlineHeading } from "./types";

/**
 * The activation line: the first pixel of the Article a visitor can actually
 * see, immediately below the site header and the reader toolbar.
 *
 * A heading counts as reached the moment it passes under the chrome rather than
 * when it leaves the viewport, because the chrome is opaque — from here down is
 * the part of the Article the visitor is being shown.
 */
const ACTIVATION_LINE_PX = STICKY_CHROME_PX;

/**
 * The last outline heading whose top has crossed the activation line.
 *
 * Read from the document rather than from an `IntersectionObserver`, because
 * the question is not whether a heading is visible — a long section leaves its
 * own heading far above the viewport and is still the section being read. It is
 * which heading was passed most recently, and that is a comparison against one
 * line.
 *
 * Headings inside a closed panel are skipped. They stay in the outline, because
 * the outline is the shape of the Article and not of the viewport, but nothing
 * that is not on the page can be the thing being read.
 */
const measureActiveHeadingId = (
  outline: readonly ArticleOutlineHeading[]
): string | null => {
  let activeId: string | null = null;

  for (const { id } of outline) {
    const heading = findArticleElement(id);

    if (heading === null || !isArticleElementRevealed(heading)) {
      continue;
    }

    // Document order, so the last heading that satisfies this is the answer:
    // before the first one crosses nothing is active, and at the end of the
    // Article the final heading simply stays the last one that crossed.
    if (heading.getBoundingClientRect().top <= ACTIVATION_LINE_PX) {
      activeId = id;
    }
  }

  return activeId;
};

/**
 * Tracks the active heading across scrolling, panel state and layout.
 *
 * Three things move a heading relative to the activation line and all three are
 * listened for: the visitor scrolls, the viewport changes shape, or a panel
 * opens and pushes everything below it down. The last is why the mutation
 * observer watches `hidden` — opening a Tab is not a scroll and not a resize,
 * and it can move every remaining heading in the Article.
 *
 * Measurements are collapsed onto an animation frame. Scroll fires far more
 * often than the screen is repainted, and a reading position that is one frame
 * old has never been wrong to a visitor.
 */
export const useActiveOutlineHeadingId = (
  outline: readonly ArticleOutlineHeading[]
): string | null => {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      setActiveId(measureActiveHeadingId(outline));
    };

    const schedule = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(measure);
      }
    };

    const panels = new MutationObserver(schedule);
    panels.observe(document.body, {
      attributeFilter: ["hidden"],
      attributes: true,
      subtree: true,
    });

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    measure();

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
      panels.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [outline]);

  return activeId;
};

/**
 * Goes to a heading a visitor deliberately chose from the outline.
 *
 * This is ordinary fragment navigation done by hand, and it stays ordinary: a
 * real history entry, so Back returns to where the visitor was reading, and no
 * `replaceState` trickery. What the browser cannot do on its own is the reveal
 * — a heading inside a closed Accordion is not a scroll target until the
 * Accordion is open — so the panels are opened first and the scroll waits for
 * the layout that produces.
 *
 * A heading that is not in this document is left alone entirely. The fragment
 * is not written, nothing scrolls, and focus stays where the visitor put it.
 */
export const selectOutlineHeading = (
  id: string,
  { reducedMotion }: { readonly reducedMotion: boolean }
): void => {
  const target = findArticleElement(id);

  if (target === null) {
    return;
  }

  revealArticleElement(target);
  window.history.pushState(null, "", `#${encodeURIComponent(id)}`);

  afterArticleLayoutSettles(() => {
    const settled = findArticleElement(id);

    if (settled === null) {
      return;
    }

    settled.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
    focusArticleElement(settled);
  });
};
