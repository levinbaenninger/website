/**
 * One normalizer for the field, `?q=`, and Fuse, so a copied link matches what
 * the next visitor's field shows.
 */

// Grapheme clusters, not code units: a family emoji costs one character, not
// eleven. Long enough for a real query, short enough that a paste cannot be
// handed to Fuse.
export const MAX_ARTICLE_SEARCH_QUERY_GRAPHEMES = 200;

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

const clampToGraphemes = (value: string, limit: number): string => {
  // Skip Segmenter when code units cannot exceed the limit.
  if (value.length <= limit) {
    return value;
  }

  let end = 0;
  let count = 0;

  for (const { index, segment } of segmenter.segment(value)) {
    if (count === limit) {
      break;
    }
    count += 1;
    end = index + segment.length;
  }

  return value.slice(0, end);
};

/**
 * NFC so combining accents match precomposed characters. `preserveTrailingSpace`
 * is a typing concession: stripping the space as it is pressed fights the
 * visitor; matching ignores it and `?q=` never carries one.
 */
export const normalizeArticleSearchQuery = (
  raw: string,
  { preserveTrailingSpace = false }: { preserveTrailingSpace?: boolean } = {}
): string => {
  const collapsed = raw.normalize("NFC").replaceAll(/\s+/gu, " ").trimStart();
  const withTrailing = preserveTrailingSpace ? collapsed : collapsed.trimEnd();

  return clampToGraphemes(
    withTrailing,
    MAX_ARTICLE_SEARCH_QUERY_GRAPHEMES
  ).trimStart();
};

// Whitespace-only must not load the artifact or reach `?q=`.
export const isEffectiveArticleSearchQuery = (value: string): boolean =>
  value.trim().length > 0;
