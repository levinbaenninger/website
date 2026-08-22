"use client";

import { useEffect } from "react";

// Heading IDs come from authored prose, so they are not safe CSS selectors.
export const findArticleElement = (id: string): HTMLElement | null =>
  // eslint-disable-next-line unicorn/prefer-query-selector
  document.getElementById(id);

const panelAncestorsOf = (target: HTMLElement): readonly HTMLElement[] => {
  const panels: HTMLElement[] = [];
  let ancestor = target.parentElement;

  while (ancestor !== null) {
    if (Object.hasOwn(ancestor.dataset, "articlePanel")) {
      panels.unshift(ancestor);
    }
    ancestor = ancestor.parentElement;
  }

  return panels;
};

// hidden="until-found" is a string, not true; test against false (absent).
export const isArticleElementRevealed = (target: HTMLElement): boolean =>
  panelAncestorsOf(target).every((panel) => panel.hidden === false);

// Radix triggers act on mousedown, so the synthetic gesture sends that too.
export const revealArticleElement = (target: HTMLElement): void => {
  for (const panel of panelAncestorsOf(target)) {
    if (panel.hidden === false) {
      continue;
    }

    const controlId = panel.getAttribute("aria-labelledby");
    if (controlId === null) {
      continue;
    }

    const control = findArticleElement(controlId);
    if (control === null) {
      continue;
    }

    control.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, button: 0 })
    );
    control.click();
  }
};

// Two rAF before scroll: the first commits the click; the second has height. Scrolling in between hits closed geometry.
export const afterArticleLayoutSettles = (settled: () => void): void => {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(settled);
  });
};

export const focusArticleElement = (target: HTMLElement): void => {
  if (!target.hasAttribute("tabindex")) {
    target.setAttribute("tabindex", "-1");
    target.addEventListener(
      "blur",
      () => {
        target.removeAttribute("tabindex");
      },
      { once: true }
    );
  }

  target.focus({ preventScroll: true });
};

export const readArticleFragmentId = (): string | null => {
  if (window.location.hash.length <= 1) {
    return null;
  }

  try {
    return decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return null;
  }
};

const revealCurrentArticleFragment = (): void => {
  const id = readArticleFragmentId();
  if (id === null) {
    return;
  }

  const target = findArticleElement(id);
  if (target === null) {
    return;
  }

  revealArticleElement(target);

  afterArticleLayoutSettles(() => {
    const settled = findArticleElement(id);
    if (settled === null) {
      return;
    }
    settled.scrollIntoView();
    focusArticleElement(settled);
  });
};

let fragmentConsumers = 0;
let removeFragmentListener: (() => void) | undefined;
let fragmentRevealScheduled = false;

const scheduleFragmentReveal = (): void => {
  if (fragmentRevealScheduled) {
    return;
  }
  fragmentRevealScheduled = true;
  queueMicrotask(() => {
    fragmentRevealScheduled = false;
    revealCurrentArticleFragment();
  });
};

export const useArticleFragmentNavigation = (): void => {
  useEffect(() => {
    fragmentConsumers += 1;
    if (fragmentConsumers === 1) {
      const handleHashChange = (): void => {
        scheduleFragmentReveal();
      };
      window.addEventListener("hashchange", handleHashChange);
      removeFragmentListener = () => {
        window.removeEventListener("hashchange", handleHashChange);
      };
      scheduleFragmentReveal();
    }

    return () => {
      fragmentConsumers -= 1;
      if (fragmentConsumers === 0) {
        removeFragmentListener?.();
        removeFragmentListener = undefined;
      }
    };
  }, []);
};
