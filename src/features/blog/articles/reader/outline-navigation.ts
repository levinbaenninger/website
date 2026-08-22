"use client";

import { useEffect, useState } from "react";

import type { ArticleOutlineHeading } from "@/features/blog/articles/types";
import {
  afterArticleLayoutSettles,
  findArticleElement,
  focusArticleElement,
  isArticleElementRevealed,
  revealArticleElement,
} from "@/features/blog/rendering/reveal";

import { STICKY_CHROME_PX } from "./reader-contract";

const ACTIVATION_LINE_PX = STICKY_CHROME_PX;

// Not an IntersectionObserver: a long section's heading is far above the viewport and is still being read.
// Closed panels stay in the outline but cannot be current — they are not on the page.
const measureActiveHeadingId = (
  outline: readonly ArticleOutlineHeading[]
): string | null => {
  let activeId: string | null = null;

  for (const { id } of outline) {
    const heading = findArticleElement(id);

    if (heading === null || !isArticleElementRevealed(heading)) {
      continue;
    }

    if (heading.getBoundingClientRect().top <= ACTIVATION_LINE_PX) {
      activeId = id;
    }
  }

  return activeId;
};

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

    // Opening a Tab is not a scroll or a resize, and it can move every remaining heading.
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

// Ordinary `pushState` so Back returns to where the visitor was reading. Reveal first: a closed Accordion is not a scroll target.
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
