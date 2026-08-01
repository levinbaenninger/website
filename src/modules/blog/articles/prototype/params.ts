// PROTOTYPE — throwaway. Delete this directory once issue #33 is decided.
//
// Server-safe parsing of the ?variant= and axis switches, so /blog/[slug] can
// pick a composition without importing a client module.

export const VARIANTS = [
  { key: "a", name: "Reference-strict" },
  { key: "b", name: "Lined meta header" },
  { key: "c", name: "Sticky reader toolbar" },
] as const;

export type VariantKey = (typeof VARIANTS)[number]["key"];

export const isVariantKey = (value: unknown): value is VariantKey =>
  VARIANTS.some((variant) => variant.key === value);

// Heading shape of the Article body. `panels` puts headings inside an Accordion
// and Tabs, which is the case the reference never has to handle.
export const CONTENT_SHAPES = ["long", "short", "none", "panels"] as const;

export type ContentShape = (typeof CONTENT_SHAPES)[number];

// Which dates and Draft treatment the header has to carry.
export const ARTICLE_STATES = ["published", "updated", "draft"] as const;

export type ArticleState = (typeof ARTICLE_STATES)[number];

// Which neighbouring Articles exist.
export const NEIGHBOURHOODS = ["both", "previous", "next", "none"] as const;

export type Neighbourhood = (typeof NEIGHBOURHOODS)[number];

// Where previous/next navigation lives.
export const PAGER_PLACEMENTS = ["toolbar", "end", "both"] as const;

export type PagerPlacement = (typeof PAGER_PLACEMENTS)[number];

// Which surface the Share action opens.
export const SHARE_SURFACES = ["menu", "copy", "dialog"] as const;

export type ShareSurface = (typeof SHARE_SURFACES)[number];

// What a reading-focus control does, and whether the toolbar carries one.
export const FOCUS_MODES = ["off", "dim", "hide"] as const;

export type FocusMode = (typeof FOCUS_MODES)[number];

// How the desktop table of contents reveals its heading list.
export const TOC_REVEALS = ["gutter-hover", "gutter-click", "toolbar"] as const;

export type TocReveal = (typeof TOC_REVEALS)[number];

// What a table-of-contents click does. The reference uses `pushstate`, which
// never fires `hashchange` — see NOTES.md.
export const TOC_JUMPS = ["pushstate", "hash", "reveal"] as const;

export type TocJump = (typeof TOC_JUMPS)[number];

export interface PrototypeSelection {
  readonly content: ContentShape;
  readonly focus: FocusMode;
  readonly jump: TocJump;
  readonly neighbourhood: Neighbourhood;
  readonly pager: PagerPlacement;
  readonly share: ShareSurface;
  readonly state: ArticleState;
  readonly toc: TocReveal;
  readonly variant: VariantKey;
}

const readAxis = <T extends string>(
  values: readonly T[],
  raw: string | string[] | undefined,
  fallback: T
): T => values.find((value) => value === raw) ?? fallback;

type RawSearchParams = Record<string, string | string[] | undefined>;

const VARIANT_DEFAULTS: Record<
  VariantKey,
  Pick<PrototypeSelection, "pager" | "share" | "toc">
> = {
  a: { pager: "toolbar", share: "menu", toc: "gutter-hover" },
  b: { pager: "end", share: "menu", toc: "gutter-hover" },
  c: { pager: "both", share: "dialog", toc: "toolbar" },
};

export const readPrototypeSelection = (
  params: RawSearchParams
): PrototypeSelection | null => {
  const { variant } = params;

  if (!isVariantKey(variant)) {
    return null;
  }

  const defaults = VARIANT_DEFAULTS[variant];

  return {
    content: readAxis(CONTENT_SHAPES, params.content, "long"),
    focus: readAxis(FOCUS_MODES, params.focus, "off"),
    jump: readAxis(TOC_JUMPS, params.jump, "pushstate"),
    neighbourhood: readAxis(NEIGHBOURHOODS, params.nav, "both"),
    pager: readAxis(PAGER_PLACEMENTS, params.pager, defaults.pager),
    share: readAxis(SHARE_SURFACES, params.share, defaults.share),
    state: readAxis(ARTICLE_STATES, params.state, "published"),
    toc: readAxis(TOC_REVEALS, params.toc, defaults.toc),
    variant,
  };
};

export const toPrototypeQuery = (selection: PrototypeSelection): string =>
  new URLSearchParams({
    content: selection.content,
    focus: selection.focus,
    jump: selection.jump,
    nav: selection.neighbourhood,
    pager: selection.pager,
    share: selection.share,
    state: selection.state,
    toc: selection.toc,
    variant: selection.variant,
  }).toString();
