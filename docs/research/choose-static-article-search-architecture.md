# Choose the static Article search architecture

Research for [Choose the static Article search architecture](https://github.com/levinbaenninger/website/issues/6), captured on 2026-07-26.

## Decision

Use the full build of **Fuse.js 7.5.0** behind a Blog-owned client adapter, with token search enabled over a build-generated, engine-neutral Article document artifact. Pin the dependency exactly. When the search surface gains focus, fetch the artifact and dynamically import Fuse in parallel, construct the in-memory index once, and retain it for the page lifetime. There is no hosted service, request-time server search, Article filesystem access, or MDX work in the browser.

Fuse 7.5's token-search mode is unusually well aligned with this ticket: it splits a multi-word query into Unicode-aware terms, fuzzy-matches each term independently, uses inverse document frequency to favor distinctive terms, preserves weighted keys, and returns exact character ranges through `includeMatches`. The full build is approximately 8.6 kB gzip according to the project; the approximately 6.8 kB basic build omits token search. [Fuse token search](https://www.fusejs.io/token-search.html); [Fuse fuzzy search and scoring](https://www.fusejs.io/fuzzy-search.html); [Fuse getting started and build sizes](https://www.fusejs.io/getting-started.html).

Do not serialize Fuse's internal index initially. Generate readable Article documents, then create Fuse on focus before the visitor types. At personal-Blog scale this keeps the durable artifact deterministic, testable, and independent of engine internals while still moving Article discovery, validation, MDX extraction, and network delivery off the query path. Fuse can accept a build-created index through `createIndex` and `parseIndex` later if measurement shows construction is material; that artifact would still require the source documents for result values and highlights and would couple generation to the exact engine and options. [Fuse indexing API](https://www.fusejs.io/api/indexing.html); [Fuse performance guidance](https://www.fusejs.io/performance.html).

## Why this fits the repository

The canonical Article contract from [issue #5](https://github.com/levinbaenninger/website/issues/5) already defines the search projection: slug, href, title, description, Tag IDs and labels, headings, and plain body text. Production projections contain only Published Articles; local development may also contain Drafts. Search must consume that projection rather than independently parsing source or rendered HTML.

The current `next.config.ts` performs a normal Next.js production build and does not set `output: "export"`. The installed Next.js documentation treats a crawlable `out/` directory as a specific static-export mode, so a post-build HTML crawler is not a stable boundary for the current deployment. [Installed Next.js static-export guide](../../node_modules/next/dist/docs/01-app/02-guides/static-exports.md); [official Next.js static-export guide](https://nextjs.org/docs/app/guides/static-exports).

Per [ADR 0001](../adr/0001-reserve-modules-for-product-capabilities.md), Article relevance, snippets, and result mapping belong to Blog. Blog exposes a deliberate client-safe search operation and result type. The app shell may compose that operation into its command menu, but shared UI does not own field weights, Article text extraction, or Fuse types.

## Engine and client boundary

```text
Article source bundles
        |
        v
Blog compilation pipeline (server/build only)
  - validates canonical Article records
  - extracts headings and normalized plain body
  - filters by environment and sorts by slug
        |
        v
versioned, engine-neutral JSON artifact
        |
        v
Blog client search adapter (lazy, one instance)
  - validates artifact
  - constructs Fuse
  - searches and maps match ranges
        |
        v
app-shell search UI (plain result data)
```

The initial shell renders and operates without Fuse or Article bodies. Opening or focusing search begins both lazy loads; hover or idle prefetching is an optional UI optimization, not a correctness requirement. Construction happens once, before query input is processed. A Web Worker, IndexedDB, request-time route, and client-side index mutation are unnecessary for the initial immutable corpus and remain hidden implementation options behind the same adapter.

Consumers call a Blog-owned operation such as `searchArticles(query)` and receive the result contract below. They never receive a Fuse instance, `FuseResult`, serialized index, scoring options, or raw match records.

## Generated document contract

Emit one stable envelope:

```ts
type ArticleSearchArtifactV1 = {
  schemaVersion: 1;
  documents: ReadonlyArray<{
    id: string; // canonical slug
    href: `/blog/${string}`;
    title: string;
    description: string;
    tags: ReadonlyArray<{ id: string; label: string }>;
    headings: readonly string[]; // source order
    body: string; // normalized plain Article body
    status: "published" | "draft";
  }>;
};
```

`schemaVersion` versions the Blog contract, not Fuse. The artifact contains no engine name, engine options, build time, absolute path, random ID, serialized class state, or marked-up excerpt. This lets compilation tests inspect the exact searchable content and permits an engine replacement without regenerating an engine-specific schema.

The compilation pipeline owns reproducibility:

1. filter to environment-visible Articles before projection;
2. sort documents by canonical slug;
3. preserve heading source order and the Tag label order fixed by issue #5;
4. normalize body line endings and whitespace under one extractor contract;
5. validate the schema, unique IDs, href/ID agreement, and absence of unsupported values;
6. serialize with fixed JSON formatting and a trailing newline;
7. generate twice in a determinism test and require byte-identical output;
8. fail development and production builds on generation errors or stale generated data.

If issue #7 places the output under `public`, the generated file should not be treated as authored source: regenerate it before development and build, prevent stale output from shipping, and decide deliberately whether it is ignored or checked in. The exact path, atomic writes, cache invalidation, and failure aggregation belong to [issue #7](https://github.com/levinbaenninger/website/issues/7), which must preserve the contract above.

## Search policy

Create Fuse with a fixed, private policy:

```ts
const options = {
  useTokenSearch: true,
  tokenMatch: "all",
  includeMatches: true,
  findAllMatches: true,
  ignoreLocation: true,
  ignoreDiacritics: true,
  includeScore: true,
  threshold: 0.35,
  keys: [
    { name: "title", weight: 8 },
    { name: "tags.label", weight: 5 },
    { name: "tags.id", weight: 4 },
    { name: "description", weight: 3 },
    { name: "headings", weight: 2 },
    { name: "body", weight: 1 },
  ],
} as const;
```

These are initial relevance values, not API promises. Fuse normalizes key weights and combines them with fuzziness and field-length normalization, so tune them with a small checked-in corpus of representative queries and expected ordering rather than intuition. Keep engine options inside the adapter; callers may supply only a normalized query and use the adapter's fixed limit, initially eight. [Fuse token options](https://www.fusejs.io/token-search.html); [Fuse scoring and weighted keys](https://www.fusejs.io/fuzzy-search.html).

`tokenMatch: "all"` ensures every query term contributes to a result, while each term still receives independent typo tolerance. `ignoreLocation` is necessary for long Article fields because the default location/distance model favors matches near the beginning. The `0.35` threshold is intentionally stricter than Fuse's broad default; it must be verified by the relevance fixture. Exact score ties resolve by canonical slug ascending, independent of source or sort stability.

Tags remain structured records in the artifact. Fuse's nested keys search both the visitor-facing label and stable ID without flattening or duplicating them. Headings remain ordered strings, allowing match data to identify the actual heading. Body is plain text derived by compilation, never rendered HTML or raw MDX.

## Accessibility-neutral result and snippet contract

Return plain strings with ranges, never highlighted HTML:

```ts
type HighlightRange = {
  start: number;
  end: number; // exclusive UTF-16 offset into text
};

type HighlightedText = {
  text: string;
  highlights: readonly HighlightRange[];
};

type ArticleSearchResult = {
  id: string;
  href: string;
  title: HighlightedText;
  tags: ReadonlyArray<{
    id: string;
    label: HighlightedText;
  }>;
  snippet:
    | (HighlightedText & {
        source: "description" | "heading" | "body";
        leadingEllipsis: boolean;
        trailingEllipsis: boolean;
      })
    | null;
  status: "published" | "draft";
};
```

Fuse match indices are inclusive UTF-16 ranges. The adapter validates and clamps them, converts the end to exclusive, sorts them, and merges overlaps. It chooses a snippet deterministically from matching description, heading, then body; crops a bounded context around the first best match without splitting a Unicode grapheme; remaps ranges into the cropped text; and records whether visual ellipses are needed. Title and Tag ranges are mapped directly to their exact source strings. Invalid or unresolvable engine match data is omitted rather than rendered.

This contract is independent of React and accessibility presentation. A view can split trusted text at the ranges and render semantic `<mark>` elements without `dangerouslySetInnerHTML`; concatenating the segments produces the original accessible text. Screen-reader announcements, result counts, empty/error states, keyboard focus, `aria-activedescendant`, and disabling a command menu's second filtering pass remain UI responsibilities rather than engine result data.

Fuse's `includeMatches` returns the key, matched value, and index pairs needed for this mapping. [Fuse result match type and examples](https://www.fusejs.io/api/options.html#includematches).

## Candidate comparison

Costs below distinguish engine JavaScript from generated content/index bytes. Published package size is not a browser bundle measurement, and Pagefind's aggregate selected-index payload is not comparable to an engine-only gzip number.

| Candidate | Retrieval and snippets | Cost and scale | Build/artifact fit | Decision |
| --- | --- | --- | --- | --- |
| **Fuse.js 7.5.0 full** | Tokenized multi-term fuzzy matching, BM25-style IDF, weighted nested keys, and direct character ranges. | About 8.6 kB gzip for the full engine, zero dependencies. It scans/builds local records, which is appropriate for tens or low hundreds of Articles. | Engine-neutral documents are sufficient; optional `createIndex`/`parseIndex` remains a measured optimization. | **Selected.** It directly covers every required behavior with the smallest result adapter. |
| **MiniSearch 7.2.0** | Purpose-built inverted full-text index with BM25+, exact/prefix/Levenshtein fuzzy search and field boosts. Results identify actual terms and fields, but not character offsets. | Small, zero-dependency, browser-oriented engine; stronger asymptotically if the corpus grows. Upstream does not publish a directly comparable gzip claim. | Excellent JSON serialize/load boundary. Highlights require rescanning source with precisely matching normalization and fuzzy-term handling. | Strong runner-up; the extra Unicode/fuzzy highlight reconstruction is the decisive disadvantage here. |
| **Orama 3.1.18** | BM25, schema fields, boosts, explicit Levenshtein tolerance, filters, save/load, and a separate highlighting package. | Orama markets its core full-text engine as under 2 kB, but that is not the total engine, highlight package, and Article-data payload. Its database, vector, plugin, and facet surface exceeds the need. | Can save/load, but introduces a broader database-shaped API plus highlight-package coordination. | Viable but disproportionate. Revisit for multilingual analyzers or richer faceting. |
| **FlexSearch 0.8.212** | Document indexes, field configuration, suggestions, export/import, phonetic fuzzy encoders, and highlighting. Its fuzzy semantics are less directly the required bounded per-term edit behavior. | Official gzip: 16.3 kB full, 11.4 kB compact, 4.5 kB light. The light build omits document search, fuzzy search, serialization, and highlighting, so it is not ticket-equivalent. | Highly configurable multi-part export/import, encoders, resolvers, workers, and stores create excess artifact and maintenance choices. | Rejected for complexity and less direct typo semantics. |
| **Pagefind 1.5.2** | Excellent static-site metadata weighting, chunked search, excerpts, highlighted excerpts, and `plain_excerpt`; no equally explicit documented Levenshtein typo contract. | Officially under 300 kB total search payload for 10,000 pages, usually nearer 100 kB. This includes runtime and selected index chunks, not only engine JS. | Standard use crawls emitted static HTML after the site generator. A Node custom-record path is possible, but produces Pagefind-specific multi-file output and still weakens the typo/highlight-range contract. | Rejected for this non-export Next build and canonical Article projection. Strong if the site later becomes a static export. |
| **Hand-written JSON scan** | Custom weighting, typo tolerance, ranking, tokenization, and snippets would all become application search-engine code. | Saves a dependency but ships all content and repeatedly scores it on the main thread. Maintenance and correctness cost dominate the saved kilobytes. | Readable deterministic input, but no proven retrieval implementation. | Rejected; it recreates the required engine. |

MiniSearch documents its browser real-time use case, full-text features, match map, and JSON serialization in its first-party repository and API. [MiniSearch repository](https://github.com/lucaong/minisearch); [MiniSearch API](https://lucaong.github.io/minisearch/classes/MiniSearch.MiniSearch.html); [MiniSearch match information](https://lucaong.github.io/minisearch/types/MiniSearch.MatchInfo.html).

Orama documents BM25 search, field boosting, Levenshtein `tolerance`, and the transition from its deprecated match-highlight plugin to a separate highlight package. [Orama search](https://docs.orama.com/docs/orama-js/search); [Orama match-highlight guidance](https://docs.orama.com/docs/orama-js/plugins/plugin-match-highlight); [Orama repository](https://github.com/oramasearch/orama).

FlexSearch publishes its build-size and feature matrix and documents Document search, phonetic search, result highlighting, and index export/import in its repository. [FlexSearch repository and documentation](https://github.com/nextapps-de/flexsearch#load-library).

Pagefind documents its post-build static lifecycle, chunked delivery, metadata weights, and result objects containing both marked-up and plain excerpts. Its Node API can add custom records and write an index without crawling HTML, but that is an alternative integration rather than the default lifecycle. [Pagefind overview](https://pagefind.app/); [running Pagefind](https://pagefind.app/docs/running-pagefind/); [Pagefind ranking](https://pagefind.app/docs/ranking/); [Pagefind JavaScript API](https://pagefind.app/docs/api/); [Pagefind Node API](https://pagefind.app/docs/node-api/).

## Cost and performance guardrails

Track three costs separately in production-build verification:

1. engine JavaScript gzip;
2. generated Article document bytes, raw and compressed;
3. first-focus network, construction, and first-query time.

The Article body corpus is likely to dominate transfer regardless of a single-digit-kilobyte engine difference. Add a representative artifact-size snapshot and relevance/performance fixture once representative Articles exist. Do not add a hosted service, server route, Worker, IndexedDB cache, or chunked index initially.

Revisit construction or the engine boundary if the compressed artifact exceeds 250 kB, construction or a representative query creates a main-thread task over 50 ms on the supported low-end browser profile, or the corpus reaches high hundreds to thousands of long Articles. First benchmark a serialized Fuse index, then a Worker behind the unchanged result contract. If whole-corpus transfer is the problem, evaluate Pagefind-style chunking or a server/hosted engine as a new decision.

The npm registry versions verified on 2026-07-26 were Fuse.js 7.5.0, MiniSearch 7.2.0, `@orama/orama` 3.1.18, FlexSearch 0.8.212, and Pagefind 1.5.2. Pin the selected exact version and rerun relevance, range-mapping, artifact-size, and determinism tests on upgrades; Fuse token search is a current feature whose behavior should not be assumed across releases.

## Boundary for follow-up tickets

This decision fixes Fuse.js token search, engine-neutral generated documents, focus-time lazy construction, Blog ownership, indexed fields and initial relevance policy, deterministic artifact rules, and the plain-text highlight-range result contract.

It intentionally leaves Article discovery, MDX-to-plain-text extraction, the generated path, cache behavior, exhaustive diagnostics, and production filesystem exclusion to [issue #7](https://github.com/levinbaenninger/website/issues/7). Search UI rendering, keyboard behavior, debouncing, loading, and empty/error states belong to later Blog or app-shell implementation work.
