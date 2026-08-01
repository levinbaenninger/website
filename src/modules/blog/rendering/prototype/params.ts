// PROTOTYPE — throwaway. Delete this directory once issue #34 is decided.
//
// Server-safe parsing of `?language=` and its axis switches, so /blog/[slug] can
// pick a presentation language without importing a client module.
//
// The key is `language`, not `variant`: `?variant=` still belongs to the reader
// prototype from issue #33, and both have to be reachable while #34 is open.

export const LANGUAGES = [
  { key: "a", name: "Reference surfaces" },
  { key: "b", name: "Lined" },
  { key: "c", name: "Semantic tint" },
] as const;

export type LanguageKey = (typeof LANGUAGES)[number]["key"];

const isLanguageKey = (value: unknown): value is LanguageKey =>
  LANGUAGES.some((language) => language.key === value);

// Which compiled specimen renders. `full` is every approved construct in
// reading order; `stress` is the same language pushed through nesting, long
// content, overflow and degenerate cases.
export const SPECIMENS = ["full", "stress"] as const;

export type Specimen = (typeof SPECIMENS)[number];

export const isSpecimen = (value: unknown): value is Specimen =>
  SPECIMENS.some((specimen) => specimen === value);

// When the code block's copy control is visible. `hover` is the reference.
export const COPY_REVEALS = ["hover", "always", "focus-coarse"] as const;

export type CopyReveal = (typeof COPY_REVEALS)[number];

// How a heading exposes its own link. `wrap` is the reference: the heading text
// is the anchor and a copy-link button appears on hover.
export const HEADING_ANCHORS = ["wrap", "leading", "none"] as const;

export type HeadingAnchor = (typeof HEADING_ANCHORS)[number];

// `reduced` forces the reduced-motion branch of the presentation CSS instead of
// making the reviewer change an operating-system setting mid-comparison.
export const MOTION_MODES = ["system", "reduced"] as const;

export type MotionMode = (typeof MOTION_MODES)[number];

export interface LanguageSelection {
  readonly anchor: HeadingAnchor;
  readonly copy: CopyReveal;
  readonly language: LanguageKey;
  readonly motion: MotionMode;
  readonly specimen: Specimen;
}

const readAxis = <T extends string>(
  values: readonly T[],
  raw: string | string[] | undefined,
  fallback: T
): T => values.find((value) => value === raw) ?? fallback;

type RawSearchParams = Record<string, string | string[] | undefined>;

export const readLanguageSelection = (
  params: RawSearchParams
): LanguageSelection | null => {
  const { language } = params;

  if (!isLanguageKey(language)) {
    return null;
  }

  return {
    anchor: readAxis(HEADING_ANCHORS, params.anchor, "wrap"),
    copy: readAxis(COPY_REVEALS, params.copy, "hover"),
    language,
    motion: readAxis(MOTION_MODES, params.motion, "system"),
    specimen: readAxis(SPECIMENS, params.specimen, "full"),
  };
};

export const toLanguageQuery = (selection: LanguageSelection): string =>
  new URLSearchParams({
    anchor: selection.anchor,
    copy: selection.copy,
    language: selection.language,
    motion: selection.motion,
    specimen: selection.specimen,
  }).toString();
