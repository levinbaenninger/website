// Reaching a heading that is inside something closed.
//
// One walk serves three callers: the Article outline's own links, a deep link
// a visitor arrived on, and Back or Forward across fragments. They differ only
// in how the fragment gets there — the work of opening the panels around the
// target, letting the layout settle, and putting focus on it is the same
// everywhere, so it lives here rather than in each of them.

"use client";

import { useEffect } from "react";

/**
 * Heading IDs come from authored prose, so they are not safe CSS selectors:
 * `#3.2 Caching` is a perfectly good ID and a syntax error in `querySelector`.
 * Every lookup in the Article goes through this.
 */
export const findArticleElement = (id: string): HTMLElement | null =>
  // eslint-disable-next-line unicorn/prefer-query-selector
  document.getElementById(id);

/**
 * The panel ancestors of an element, outermost first.
 *
 * Order is the whole point: a Tab inside an Accordion cannot be selected while
 * the Accordion around it is still closed, because its trigger is not mounted
 * yet. Opening from the outside in is what makes a nested target reachable.
 */
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

/**
 * Whether an element is currently rendered rather than sitting in a closed
 * panel.
 *
 * A closed panel carries `hidden="until-found"`, which is a string rather than
 * `true`, so the test is against `false` — the value the attribute reports when
 * it is absent altogether.
 */
export const isArticleElementRevealed = (target: HTMLElement): boolean =>
  panelAncestorsOf(target).every((panel) => panel.hidden === false);

/**
 * Opens every closed panel between the Article and `target`, outermost first.
 *
 * A panel is opened through the control that labels it rather than through
 * component state, because the panels are three different components — an
 * Accordion item, a Tab, a code Tab — and `aria-labelledby` is the one thing
 * all three agree on. Radix triggers act on `mousedown`, so the synthetic
 * gesture sends that as well as the click.
 *
 * Panels that are already open are left alone, and no unrelated panel is
 * touched: revealing a heading is not an invitation to rearrange the Article.
 */
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

/**
 * Runs `settled` once the panels opened above have actually laid out.
 *
 * Two frames, not one: the first is where React commits the state change the
 * synthetic click caused, and the second is the first frame in which the
 * revealed content has a height. Scrolling or focusing in between lands on the
 * geometry the Article had before it opened.
 */
export const afterArticleLayoutSettles = (settled: () => void): void => {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(settled);
  });
};

/**
 * Moves focus to a fragment target without moving the page.
 *
 * A heading is not focusable, so it borrows a `tabindex` for exactly as long as
 * it holds focus; leaving it behind permanently would put every visited heading
 * into the tab order. `preventScroll` matters because focus has its own
 * scrolling behaviour, and the caller has already scrolled — without it a
 * smooth scroll is interrupted by an instant jump to the same place.
 */
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

/**
 * The current fragment as an element ID, or `null` when there is nothing usable
 * to resolve.
 *
 * A fragment that is not valid percent-encoding is a malformed one: it is left
 * in the URL exactly as the visitor sent it, and nothing else happens.
 */
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

/**
 * Everything a fragment the visitor did not click has to do: an initial deep
 * link, and Back or Forward across fragments.
 *
 * Instant, never smooth — an arriving visitor has no scroll position to be
 * moved from, and a restored history entry is meant to look like the place the
 * visitor left. A fragment naming nothing in this Article is left in the URL
 * and otherwise ignored: it is not this module's business to correct a URL, and
 * a failed lookup is no reason to take focus off whatever has it.
 */
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

/**
 * Subscribes a client island to fragment navigation.
 *
 * Counted rather than per-component: an Article with three Accordions and an
 * outline has four islands that all need this behaviour and exactly one
 * `hashchange` listener's worth of it. The first consumer also runs the reveal
 * once, which is what handles the fragment a visitor arrived on; the microtask
 * collapses the burst of consumers that hydrate together into that single run.
 */
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
