/**
 * The two numbers the reader chrome and its one client island have to agree on.
 *
 * Kept in a module of their own so the island stays a leaf: importing them from
 * the chrome would pull server components into a `"use client"` graph.
 */

/** The `h1` slot the sticky toolbar copy observes. */
export const ARTICLE_TITLE_SLOT = "article-title";

/** The site header's 48 px plus the reader toolbar's 44 px. */
export const STICKY_CHROME_PX = 92;
