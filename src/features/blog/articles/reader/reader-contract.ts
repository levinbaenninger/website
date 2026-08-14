/**
 * What the server-rendered reader chrome and its client islands have to agree
 * on: the elements they find each other by, and the height of the chrome.
 *
 * Kept in a module of their own so the islands stay leaves: importing them from
 * the chrome would pull server components into a `"use client"` graph.
 */

/** The `h1` slot the sticky toolbar copy observes. */
export const ARTICLE_TITLE_SLOT = "article-title";

/**
 * The toolbar's own neighbour links, which the `h`/`l` keys activate.
 *
 * The toolbar pair rather than the end pager's: it is rendered at every scroll
 * position, so a key has something to click wherever the visitor is. A control
 * no chrome renders is the collection boundary, and the keys do nothing.
 *
 * An attribute of its own rather than a `data-slot`, because these anchors are
 * a `Button` rendered `asChild`: the child's props win, so a `data-slot` here
 * would take the place of the one the Button contributes.
 */
export const ARTICLE_NEIGHBOUR_ATTRIBUTE = "data-article-neighbour";
export const ARTICLE_PREVIOUS_CONTROL = `[${ARTICLE_NEIGHBOUR_ATTRIBUTE}="previous"]`;
export const ARTICLE_NEXT_CONTROL = `[${ARTICLE_NEIGHBOUR_ATTRIBUTE}="next"]`;

/** The site header's 48 px plus the reader toolbar's 44 px. */
export const STICKY_CHROME_PX = 92;
