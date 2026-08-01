// PROTOTYPE — throwaway. Delete this directory once issue #33 is decided.
//
// Active-heading tracking and heading jumps.
//
// The observer is adapted from ncdai/chanhdai.com @ 83e0b842 (MIT, © Chánh Đại),
// which in turn adapts fumadocs-core's TOC anchor observer: watch every heading
// with `threshold: 0.9`, treat the most recently activated one as current, and
// fall back to whichever heading sits closest to the top of the viewport when
// none of them qualify.

"use client";

import { useEffect, useState } from "react";

import type { ArticleHeadingFact } from "@/modules/blog/articles/facts";

import type { TocJump } from "./params";

interface Tracked {
  readonly active: boolean;
  readonly at: number;
  readonly fallback: boolean;
}

const findElement = (id: string): HTMLElement | null =>
  // Heading ids come from authored prose and are not safe CSS selectors.
  // eslint-disable-next-line unicorn/prefer-query-selector
  document.getElementById(id);

export const useActiveHeadingId = (
  headings: readonly ArticleHeadingFact[]
): string | null => {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const tracked = new Map<string, Tracked>(
      headings.map(({ id }) => [id, { active: false, at: 0, fallback: false }])
    );

    const publish = () => {
      let winner: string | null = null;
      let winnerAt = -1;

      for (const [id, entry] of tracked) {
        if (entry.active && entry.at > winnerAt) {
          winner = id;
          winnerAt = entry.at;
        }
      }

      setActiveId(winner);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const previous = tracked.get(entry.target.id);
          if (previous === undefined) {
            continue;
          }
          if (previous.active === entry.isIntersecting && !previous.fallback) {
            continue;
          }
          tracked.set(entry.target.id, {
            active: entry.isIntersecting,
            at: Date.now(),
            fallback: false,
          });
        }

        const hasActive = [...tracked.values()].some((entry) => entry.active);

        if (!hasActive) {
          const viewTop = entries[0]?.rootBounds?.top ?? 0;
          let nearestId: string | null = null;
          let nearestDistance = Number.MAX_VALUE;

          for (const { id } of headings) {
            const element = findElement(id);
            if (element === null) {
              continue;
            }
            const distance = Math.abs(
              viewTop - element.getBoundingClientRect().top
            );
            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearestId = id;
            }
          }

          if (nearestId !== null) {
            tracked.set(nearestId, {
              active: true,
              at: Date.now(),
              fallback: true,
            });
          }
        }

        publish();
      },
      { threshold: 0.9 }
    );

    for (const { id } of headings) {
      const element = findElement(id);
      if (element !== null) {
        observer.observe(element);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [headings]);

  // A body without headings has no active heading, without an effect having to
  // reset the state when the fixture changes.
  return headings.length === 0 ? null : activeId;
};

// Prototype-local copy of the reveal walk that
// `src/modules/blog/rendering/interactions.tsx` performs on `hashchange`: open
// every collapsed `[data-article-panel]` ancestor by activating the control that
// labels it. The module does not export this, which is exactly the finding the
// `reveal` axis is here to demonstrate.
const revealPanelsFor = (target: HTMLElement): void => {
  const panels: HTMLElement[] = [];
  let ancestor = target.parentElement;

  while (ancestor !== null) {
    if (Object.hasOwn(ancestor.dataset, "articlePanel")) {
      panels.unshift(ancestor);
    }
    ancestor = ancestor.parentElement;
  }

  for (const panel of panels) {
    if (panel.hidden === false) {
      continue;
    }
    const controlId = panel.getAttribute("aria-labelledby");
    if (controlId === null) {
      continue;
    }
    const control = findElement(controlId);
    if (control === null) {
      continue;
    }
    control.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, button: 0 })
    );
    control.click();
  }
};

export const jumpToHeading = (
  id: string,
  { jump, reducedMotion }: { jump: TocJump; reducedMotion: boolean }
): void => {
  // `hash` hands the whole job to the browser, which fires `hashchange` and lets
  // the Article's existing reveal machinery run.
  if (jump === "hash") {
    window.location.hash = `#${id}`;
    return;
  }

  const target = findElement(id);

  if (jump === "reveal" && target !== null) {
    revealPanelsFor(target);
  }

  history.pushState(null, "", `#${id}`);

  window.requestAnimationFrame(() => {
    findElement(id)?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
    });
  });
};
