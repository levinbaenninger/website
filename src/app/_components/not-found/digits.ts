export interface PlotterStroke {
  d: string;
  offsetX: number;
  offsetY: number;
  /** Approximate pen-down length, so plot time is spent at a constant speed. */
  length: number;
}

const GLYPH_ORIGIN_Y = 10;
const BASELINE_Y = 132;

const FOUR_STROKES = [
  { d: "M70 8 12 96 94 96", length: 187 },
  { d: "M70 8V132", length: 124 },
] as const;

const ZERO_STROKES = [
  {
    d: "M50 8C27 8 8 36 8 70 8 104 27 132 50 132 73 132 92 104 92 70 92 36 73 8 50 8Z",
    length: 330,
  },
  { d: "M26 118 74 22", length: 107 },
] as const;

/**
 * `0` sits tighter against the trailing `4` than `4` does against `0`: that
 * glyph's diagonal recedes up and to the right, so an even metric gap reads as
 * an uneven optical one. The last advance is unused.
 */
const PLOT_GLYPHS = [
  { strokes: FOUR_STROKES, advance: 108 },
  { strokes: ZERO_STROKES, advance: 100 },
  { strokes: FOUR_STROKES, advance: 0 },
] as const;

/** Chosen so the inked word sits centred in the viewBox. */
const FIRST_GLYPH_ORIGIN_X = 43;

const createPlotStrokes = (): readonly PlotterStroke[] => {
  let originX = FIRST_GLYPH_ORIGIN_X;

  return PLOT_GLYPHS.flatMap((glyph) => {
    const strokes = glyph.strokes.map((stroke) => ({
      ...stroke,
      offsetX: originX,
      offsetY: GLYPH_ORIGIN_Y,
    }));

    originX += glyph.advance;

    return strokes;
  });
};

export const PLOT_STROKES: readonly PlotterStroke[] = createPlotStrokes();

export const PLOT_VIEWBOX = { width: 400, height: 160 } as const;

const LAST_GLYPH_ORIGIN_X = PLOT_GLYPHS.slice(0, -1).reduce(
  (originX, glyph) => originX + glyph.advance,
  FIRST_GLYPH_ORIGIN_X
);

export const PEN_PARK_POINT = {
  x: LAST_GLYPH_ORIGIN_X + 70,
  y: GLYPH_ORIGIN_Y + BASELINE_Y,
} as const;
