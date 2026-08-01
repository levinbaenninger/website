// PROTOTYPE — throwaway. Delete this directory once issue #32 is decided.
//
// Server-safe parsing of the ?variant= and ?state= switches, so the /blog route
// can pick a variant without importing a client module.

export const VARIANTS = [
  { key: "a", name: "Reference-strict" },
  { key: "b", name: "Tag facet strip" },
  { key: "c", name: "Search-first toolbar" },
] as const;

export type VariantKey = (typeof VARIANTS)[number]["key"];

export const isVariantKey = (value: unknown): value is VariantKey =>
  VARIANTS.some((variant) => variant.key === value);

export const PROTOTYPE_STATES = [
  "default",
  "loading",
  "error",
  "no-results",
  "zero",
] as const;

export type PrototypeState = (typeof PROTOTYPE_STATES)[number];

export const isPrototypeState = (value: unknown): value is PrototypeState =>
  PROTOTYPE_STATES.some((state) => state === value);

// How a card handles a title that wraps to more lines than its neighbour's.
// Only variant B reads this.
export const ALIGNMENTS = [
  "meta-bottom",
  "natural",
  "clamp-2",
  "reserve-2",
] as const;

export type Alignment = (typeof ALIGNMENTS)[number];

export const isAlignment = (value: unknown): value is Alignment =>
  ALIGNMENTS.some((alignment) => alignment === value);

// Whether a card carries a line of prose under its title, and when.
// Only variant B reads this.
export const SNIPPET_MODES = ["always", "never", "conditional"] as const;

export type SnippetMode = (typeof SNIPPET_MODES)[number];

export const isSnippetMode = (value: unknown): value is SnippetMode =>
  SNIPPET_MODES.some((mode) => mode === value);

// How the card's date and Tags are laid out. Only variant B reads this.
export const CARD_LAYOUTS = ["stacked", "inline", "no-tags"] as const;

export type CardLayout = (typeof CARD_LAYOUTS)[number];

export const isCardLayout = (value: unknown): value is CardLayout =>
  CARD_LAYOUTS.some((layout) => layout === value);
