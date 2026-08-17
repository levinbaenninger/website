/**
 * Kept in a module of their own so the islands stay leaves: importing them from
 * the chrome would pull server components into a `"use client"` graph.
 */

export const ARTICLE_TITLE_SLOT = "article-title";

/**
 * The toolbar pair rather than the end pager's: it is rendered at every scroll
 * position, so a key has something to click wherever the visitor is.
 *
 * An attribute of its own rather than a `data-slot`, because these anchors are
 * a `Button` rendered `asChild`: the child's props win, so a `data-slot` here
 * would take the place of the one the Button contributes.
 */
export const ARTICLE_NEIGHBOUR_ATTRIBUTE = "data-article-neighbour";
export const ARTICLE_PREVIOUS_CONTROL = `[${ARTICLE_NEIGHBOUR_ATTRIBUTE}="previous"]`;
export const ARTICLE_NEXT_CONTROL = `[${ARTICLE_NEIGHBOUR_ATTRIBUTE}="next"]`;

// Site header (48) + reader toolbar (44).
export const STICKY_CHROME_PX = 92;
