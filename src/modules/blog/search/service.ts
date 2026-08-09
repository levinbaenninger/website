import type {
  default as Fuse,
  FuseResult,
  FuseResultMatch,
  IFuseOptions,
} from "fuse.js";

import type { ArticleSearchDocument } from "@/modules/blog/articles/types";

import {
  compareArticleSearchIds,
  parseArticleSearchArtifact,
} from "./contract";
import type { ArticleSearchArtifact } from "./contract";

export const ARTICLE_SEARCH_ARTIFACT_URL = "/blog/search.json";

// Two gates, tuned together against the behavioral fixtures in the tests
// beside this file rather than carried over from the prototype's numbers.
//
// `threshold` is the candidate gate: how far a single token may be from the
// text it matched. At 0.35 a four-letter query reached words it shares almost
// nothing with (`rust` matched an Article about caching); 0.2 still absorbs a
// dropped or transposed letter and stops inventing matches.
//
// `FINAL_SCORE_CUTOFF` is the relevance gate on Fuse's weighted composite. It
// exists because the composite is the only place field weighting shows up, and
// weighting alone cannot tell a body match apart from noise. `ignoreFieldNorm`
// is what makes the pair work: field-length normalization used to push every
// body-only match to ~0.96 — indistinguishable from junk — which is why an
// Article whose *body* said `spreadsheet` answered `No articles found`.
// Without it, an exact body-only match lands near 0.70 and near-threshold
// noise near 0.92, so 0.8 separates them with room on both sides.
const FINAL_SCORE_CUTOFF = 0.8;

const MAX_BODY_SNIPPET_GRAPHEMES = 160;

// Kept short on purpose: the card gives the excerpt a fixed two-line slot, and
// at the 390 px acceptance width two lines hold roughly 110 characters. More
// lead-in than this pushes the first highlight out of the visible slot, which
// is the one thing the excerpt exists to show.
const BODY_SNIPPET_LEADING_GRAPHEMES = 40;

const FUSE_OPTIONS = {
  useTokenSearch: true,
  tokenMatch: "all",
  includeMatches: true,
  findAllMatches: true,
  ignoreLocation: true,
  ignoreFieldNorm: true,
  ignoreDiacritics: true,
  includeScore: true,
  threshold: 0.2,
  // Visible text only. Canonical Tag IDs are addressed by `?tag=`, and a
  // free-text match a visitor cannot see on the page cannot be explained.
  keys: [
    { name: "title", weight: 8 },
    { name: "tags.label", weight: 5 },
    { name: "description", weight: 3 },
    { name: "headings", weight: 2 },
    { name: "body", weight: 1 },
  ],
} as const satisfies IFuseOptions<ArticleSearchDocument>;

export interface HighlightRange {
  readonly start: number;
  readonly end: number;
}

export interface HighlightedText {
  readonly text: string;
  readonly highlights: readonly HighlightRange[];
}

export type ArticleSearchSnippet = HighlightedText & {
  readonly source: "description" | "heading" | "body";
  readonly leadingEllipsis: boolean;
  readonly trailingEllipsis: boolean;
};

export interface ArticleSearchResult {
  readonly id: string;
  readonly href: `/blog/${string}`;
  readonly title: HighlightedText;
  readonly tags: readonly {
    readonly id: string;
    readonly label: HighlightedText;
  }[];
  readonly snippet: ArticleSearchSnippet | null;
  readonly status: "published" | "draft";
}

export interface ArticleSearch {
  readonly search: (query: string) => readonly ArticleSearchResult[];
}

interface FuseModule {
  readonly default: typeof Fuse;
}

interface ArticleSearchLoaderDependencies {
  readonly fetchArtifact: (url: string) => Promise<Response>;
  readonly loadFuse: () => Promise<FuseModule>;
}

export interface ArticleSearchLoader {
  readonly load: () => Promise<ArticleSearch>;
}

const normalizeQuery = (query: string): string =>
  query.normalize("NFC").trim().replaceAll(/\s+/gu, " ");

const mergeRanges = (
  ranges: readonly HighlightRange[]
): readonly HighlightRange[] => {
  const sorted = ranges.toSorted(
    (left, right) => left.start - right.start || left.end - right.end
  );
  const merged: HighlightRange[] = [];

  for (const range of sorted) {
    const previous = merged.at(-1);
    if (previous !== undefined && range.start <= previous.end) {
      merged[merged.length - 1] = {
        start: previous.start,
        end: Math.max(previous.end, range.end),
      };
    } else {
      merged.push(range);
    }
  }

  return merged;
};

const getMatchRanges = (
  match: FuseResultMatch,
  text: string
): readonly HighlightRange[] => {
  if (match.value !== text) {
    return [];
  }

  return mergeRanges(
    match.indices.flatMap(([start, inclusiveEnd]) =>
      Number.isInteger(start) &&
      Number.isInteger(inclusiveEnd) &&
      start >= 0 &&
      inclusiveEnd >= start &&
      inclusiveEnd < text.length
        ? [{ start, end: inclusiveEnd + 1 }]
        : []
    )
  );
};

const rangesFor = (
  matches: readonly FuseResultMatch[],
  key: string,
  text: string,
  refIndex?: number
): readonly HighlightRange[] =>
  mergeRanges(
    matches
      .filter(
        (match) =>
          match.key === key &&
          (refIndex === undefined || match.refIndex === refIndex)
      )
      .flatMap((match) => getMatchRanges(match, text))
  );

const createBodySnippet = (
  text: string,
  highlights: readonly HighlightRange[]
): ArticleSearchSnippet => {
  const segments = [
    ...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(text),
  ];
  const [firstMatch] = highlights;

  if (
    firstMatch === undefined ||
    segments.length <= MAX_BODY_SNIPPET_GRAPHEMES
  ) {
    return {
      highlights,
      leadingEllipsis: false,
      source: "body",
      text,
      trailingEllipsis: false,
    };
  }

  const matchSegmentIndex = Math.max(
    0,
    segments.findIndex(
      (segment) =>
        firstMatch.start >= segment.index &&
        firstMatch.start < segment.index + segment.segment.length
    )
  );
  const startSegmentIndex = Math.max(
    0,
    matchSegmentIndex - BODY_SNIPPET_LEADING_GRAPHEMES
  );
  const endSegmentIndex = Math.min(
    segments.length,
    startSegmentIndex + MAX_BODY_SNIPPET_GRAPHEMES
  );
  const start = segments[startSegmentIndex]?.index ?? 0;
  const end =
    endSegmentIndex === segments.length
      ? text.length
      : (segments[endSegmentIndex]?.index ?? text.length);
  const croppedHighlights = highlights.flatMap((range) => {
    const croppedStart = Math.max(range.start, start);
    const croppedEnd = Math.min(range.end, end);
    return croppedStart < croppedEnd
      ? [{ start: croppedStart - start, end: croppedEnd - start }]
      : [];
  });

  return {
    highlights: croppedHighlights,
    leadingEllipsis: start > 0,
    source: "body",
    text: text.slice(start, end),
    trailingEllipsis: end < text.length,
  };
};

const createSnippet = (
  document: ArticleSearchDocument,
  matches: readonly FuseResultMatch[]
): ArticleSearchSnippet | null => {
  const descriptionHighlights = rangesFor(
    matches,
    "description",
    document.description
  );
  if (descriptionHighlights.length > 0) {
    return {
      highlights: descriptionHighlights,
      leadingEllipsis: false,
      source: "description",
      text: document.description,
      trailingEllipsis: false,
    };
  }

  for (const [index, heading] of document.headings.entries()) {
    const headingHighlights = rangesFor(matches, "headings", heading, index);
    if (headingHighlights.length > 0) {
      return {
        highlights: headingHighlights,
        leadingEllipsis: false,
        source: "heading",
        text: heading,
        trailingEllipsis: false,
      };
    }
  }

  const bodyHighlights = rangesFor(matches, "body", document.body);
  return bodyHighlights.length === 0
    ? null
    : createBodySnippet(document.body, bodyHighlights);
};

const toSearchResult = (
  result: FuseResult<ArticleSearchDocument>
): ArticleSearchResult => {
  const matches = result.matches ?? [];
  const document = result.item;

  return {
    id: document.id,
    href: document.href,
    title: {
      text: document.title,
      highlights: rangesFor(matches, "title", document.title),
    },
    tags: document.tags.map((tag, index) => ({
      id: tag.id,
      label: {
        text: tag.label,
        highlights: rangesFor(matches, "tags.label", tag.label, index),
      },
    })),
    snippet: createSnippet(document, matches),
    status: document.status,
  };
};

const createSearch = (
  FuseConstructor: FuseModule["default"],
  artifact: ArticleSearchArtifact
): ArticleSearch => {
  const index = new FuseConstructor(artifact.documents, FUSE_OPTIONS);

  return {
    search(query) {
      const normalizedQuery = normalizeQuery(query);
      if (normalizedQuery.length === 0) {
        return [];
      }

      return index
        .search(normalizedQuery)
        .filter(
          (result) =>
            result.score !== undefined && result.score <= FINAL_SCORE_CUTOFF
        )
        .toSorted(
          (left, right) =>
            (left.score ?? 1) - (right.score ?? 1) ||
            compareArticleSearchIds(left.item.id, right.item.id)
        )
        .map(toSearchResult);
    },
  };
};

const loadArtifact = async (
  fetchArtifact: ArticleSearchLoaderDependencies["fetchArtifact"]
): Promise<ArticleSearchArtifact> => {
  const response = await fetchArtifact(ARTICLE_SEARCH_ARTIFACT_URL);
  if (!response.ok) {
    throw new Error(
      `Article search artifact request failed with status ${response.status}.`
    );
  }

  return parseArticleSearchArtifact(await response.json());
};

export const createArticleSearchLoader = ({
  fetchArtifact,
  loadFuse,
}: ArticleSearchLoaderDependencies): ArticleSearchLoader => {
  let searchPromise: Promise<ArticleSearch> | undefined;

  const loadWithRecovery = async (): Promise<ArticleSearch> => {
    try {
      const [artifact, { default: Fuse }] = await Promise.all([
        loadArtifact(fetchArtifact),
        loadFuse(),
      ]);
      return createSearch(Fuse, artifact);
    } catch (error) {
      searchPromise = undefined;
      throw error;
    }
  };

  return {
    async load() {
      searchPromise ??= loadWithRecovery();
      return await searchPromise;
    },
  };
};
