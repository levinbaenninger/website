/**
 * The canonical form of an Article search query.
 *
 * One normalizer serves three callers that must never disagree: the search
 * field, the `?q=` parameter, and Fuse. Typed text, pasted text and a query
 * restored from a shared link all pass through here, so a link a visitor
 * copies is the same link the next visitor's field shows.
 */

// Long enough for any real query and short enough that a pathological paste
// cannot be handed to Fuse. Counted in grapheme clusters rather than code
// units so a family emoji costs one character, not eleven.
export const MAX_ARTICLE_SEARCH_QUERY_GRAPHEMES = 200;

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

const clampToGraphemes = (value: string, limit: number): string => {
  // `Intl.Segmenter` is the expensive part, so skip it whenever the value is
  // short enough in code units that it cannot possibly exceed the limit.
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
 * Canonicalize a query.
 *
 * NFC first, so `Café` typed as `e` plus a combining accent matches `Café`
 * written as one code point. Runs of whitespace collapse to one space and
 * leading whitespace goes: neither ever changes what matches, and both would
 * otherwise reach the URL.
 *
 * `preserveTrailingSpace` is the one concession to typing. Multiword queries
 * are typed one space at a time, and stripping that space as it is pressed
 * makes the field fight the visitor. The space survives only while the field
 * is focused; matching ignores it, and it is trimmed on blur and whenever a
 * query is restored, so `?q=` never carries one.
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

/**
 * Whether a query has anything to search for. A query of only whitespace is
 * not one: it must not load the search artifact, and it must not reach `?q=`.
 */
export const isEffectiveArticleSearchQuery = (value: string): boolean =>
  value.trim().length > 0;
