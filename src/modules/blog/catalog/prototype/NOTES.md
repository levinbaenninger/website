# PROTOTYPE — Blog catalog search and Tag discovery

Throwaway artifact for [issue #32](https://github.com/levinbaenninger/website/issues/32) on map [#30](https://github.com/levinbaenninger/website/issues/30). Delete this whole directory (and the prototype branch in `src/app/blog/page.tsx`) once the question is answered.

## Question

> What concrete catalog composition best adapts Chánh Đại's Blog listing to Levin's Cover, Tag-facet, Draft, and static full-text search contracts?

## What is _not_ variable

Everything the reference already answers is held identical across all three variants, per the map's "keep it exactly the same to the inspiration" instruction and the inventory in `docs/research/inventory-blog-ui-reference-and-component-foundations.md`:

- 48 rem (`md:w-3xl`) lined rail, `screen-line-*` strips, `border-line` column rails
- page heading: tagline 14 px / `tracking-wider` / muted, title 36 px / weight 500 / `tracking-tight` / balanced, lined top and bottom
- 36 px search field (`InputGroup`) in an 8 px lined strip, inline search icon, clear control only when non-empty, Escape clears
- one column below `sm`, two columns at `sm` with 16 px gap, alternating `nth-[2n+1]` guide lines
- card: 8 px outer padding, 8 px content inset, hover background, 1200:630 Cover at 12 px radius with adaptive inset ring, grayscale at rest → colour over 300 ms
- card title 18 px / weight 500 / balanced, date `dd.MM.yyyy` with an ISO `dateTime`
- `No articles found.` fallback in mono

Markup for those parts is adapted from `ncdai/chanhdai.com` @ `83e0b842` (MIT, © Chánh Đại).

## What the variants disagree about

The three open axes — the places the reference gives no answer because it has no Tags, no fuzzy search, and no Drafts.

| Axis | A — Reference-strict | B — Tag facet strip | C — Search-first toolbar |
| --- | --- | --- | --- |
| Tag controls | none; Tags are display-only Badges inside the card meta. Filtering happens by typing a Tag label (Fuse weights `tags.label` at 5) | own lined strip under the search field: single-select facets with Article counts, plus `All`. Tags **also** appear as Badges on the card | multi-select chips on the same strip as the search field, horizontally scrollable at mobile; filters combine with AND |
| Search results | same Cover grid, highlighted title only — no snippet, exactly like the reference list | same Cover grid, highlighted title plus a two-line highlighted snippet | grid is replaced by a dense one-column result list: 128 px Cover thumbnail, highlighted title and Tag labels, snippet with its origin (`Summary` / `Heading` / `In the article`) and ellipses |
| Draft | hollow status dot with an `sr-only` label | `Draft` Badge pinned on the Cover | dashed Cover ring plus a `Draft` text marker |
| `updatedAt` | filled status dot | not shown at all | trailing `· upd. dd.MM.yyyy` |
| Loading / error / no results / zero | a mono `Notice` cell inside the grid | grid is left behind; a centered `Empty` block with icon, title and description | mono `Notice` cell |

Trade-off to look for: A is the most faithful but a body-only match shows a card with no visible reason for being there; B keeps the reference geometry and pays one strip of vertical space for real Tag filtering; C gives search the most information but makes the query state look like a different page.

## Revision 2 — Levin picked B, with changes

Applied to B only (A and C are unchanged, so the comparison still holds):

1. Card drops the updated date; Tags come back as Badges the way A shows them.
2. The grid is only for the populated catalog. Loading, error, no-results and zero-Articles render a centered block built from the `@shadcn/empty` primitive — copied into `empty.tsx` rather than installed, because this map is planning-only. If B ships, install `@shadcn/empty` in the implementation ticket (zero dependencies, radix-nova style, matches `components.json`).

Applied to the shared chrome, so it lands in all three variants:

3. `pt-12` above the tagline. This is what the reference does — its pages layout carries `pt-12` — and it was the missing 48 px.
4. `py-2` on the title. This is a deliberate deviation: the reference h1 has no vertical padding, so it now stands 96 px tall against the reference's 80 px.
5. Removed `min-h-svh` from the variant roots. That was copied from the reference, and it forced a full viewport of empty rail whenever the content was short (any search or empty state). The app shell already carries the rail lines down to the footer with its own `flex-1` filler, so the shell handles it. The gap from the last row to the footer is 16 px, same as the reference.

## Revision 3 — long titles break the row rhythm

A three-line title pushes its date and Tags out of line with the card beside it. Four answers, switchable in B with `?align=` (bottom row of the switcher):

| `?align=` | What it does | Cost |
| --- | --- | --- |
| `meta-bottom` (default, recommended) | Meta group is pinned to the card bottom with `mt-auto`; the title grows into the space above it. Cards are already equal height, so every date and Tag row in a row lines up. | A short title leaves a visible gap between title and date. |
| `natural` | Today's behaviour: everything flows from the top. | Rows drift apart as soon as titles differ in length. |
| `clamp-2` | `line-clamp-2` plus `min-h-[2lh]`. Perfectly uniform cards. | Truncates the title — the catalog's primary information. |
| `reserve-2` | `min-h-[2lh]` only; a longer title runs past it. | Fixes two-line-vs-one-line rows, does nothing for the three-line case. |

Measured at 1280 with the long "performance budget" title next to a two-line title: `meta-bottom` puts both dates at the same y and both Tag rows at the same y, with the full title intact. `reserve-2` still leaves 25 px of drift. `clamp-2` aligns but cuts the title. Only B reads `?align=`; the buttons are disabled in A and C.

## Revision 4 — the card should not change shape when a query starts

Revision 2 rendered the search snippet only while searching, so a card gained a paragraph mid-keystroke and every card in the row moved. Three answers, switchable in B with `?snippet=`:

| `?snippet=` | Behaviour | Cost |
| --- | --- | --- |
| `always` (default, recommended) | The description sits on the card while browsing; a query only swaps its text for whichever snippet matched and adds highlights. Measured: card height 378 px browsing, 378 px searching — no jump. | Deviates from the reference, which puts no description on a card. Cards grow ~44 px. |
| `never` | No prose line at all; only the title and Tag labels highlight. Closest to the reference. | A match the card cannot explain shows as a card with nothing highlighted. |
| `conditional` | Revision 2 behaviour, kept for comparison. | Cards jump as soon as a query starts. |

**Finding while testing this.** With the shipped Fuse configuration, body- and heading-only matches never survive the score cutoff on this fixture: `revalidate`, `spreadsheet`, `monthly audit`, `dynamic hole`, `cache profile` and `prerendered` all return `No articles found`, though every one of them appears in a fixture body or heading. Body is weighted 1 against title 8, and `FINAL_SCORE_CUTOFF` is 0.35, so a body-only hit is filtered before it reaches the UI. That weakens the original case for the snippet — in practice every surviving result is explained by its title, Tags or description, which `always` already shows. It is a search-tuning question, not a UI one; raise it on [Specify Blog catalog search and Tag interactions](https://github.com/levinbaenninger/website/issues/35) rather than changing the engine here.

## Revision 5 — card density, and the fix to `conditional`

`conditional` now means "prose on **every** result card while searching, none while browsing". `result.snippet` is null for a title- or Tag-only match, so it falls back to the description; otherwise some result cards carried prose and some did not, which left ragged rows and uneven gaps under `meta-bottom`. Default is now `snippet=conditional`.

New axis `?card=` for how the card carries its date and Tags:

| `?card=` | Card height at 1280 (browsing) | Note |
| --- | --- | --- |
| `stacked` (default) | 378 px with prose, 334 px without | Revision 2 layout: date on its own line, Tags underneath. |
| `inline` | 310 px, 335 px when a card has 3 Tags | Date and Tags share a line; the meta row is 28 px until the Tags wrap, then 52 px. |
| `no-tags` | 350 px with prose always, 306 px without | The facet strip above already lists every Tag with counts, so the card repeats nothing. |

`snippet=always` + `card=no-tags` is the "description without Tags" combination — 350 px per card against 378 px for the current default, and the meta row is a single date.

The three axes are independent, so all nine combinations are reachable. Only variant B reads them.

## How to run it

```bash
vp run dev
```

- `http://localhost:3000/blog?variant=a`
- `http://localhost:3000/blog?variant=b`
- `http://localhost:3000/blog?variant=c`

`←` / `→` cycle variants. The bottom bar also forces the required states via `?state=`:

`default`, `loading`, `error`, `no-results`, `zero`

The prototype only renders when `NODE_ENV !== "production"`; without `?variant=` the route renders the real `BlogView`.

## What is real and what is fake

- Real: the Fuse service (`src/modules/blog/search/service.ts`), its weighting, score cutoff, highlight ranges and snippet cropping, the search artifact contract, `ArticleSummary` / `ArticleTagFacet` / `ArticleSearchResult` shapes, `InputGroup` / `Badge` / `Button` / `Spinner`, the shell rail. `default` and `no-results` go through that real loader.
- Fake: six fixture Articles with generated Cover images, and prototype-only Tags (production `TAGS` has two entries, too few to exercise facets). The artifact is injected through `createArticleSearchLoader`'s `fetchArtifact` seam instead of `/blog/search.json`. `loading` and `error` are UI simulations — the fixture artifact resolves instantly, so those two states are forced in the hook rather than proving the real failure path.

## Deviations from the reference inside the "held constant" set

- Placeholder reads `Search articles…`, not `Search blog…` — the domain language says Article.
- Query state is component-local; the reference keeps it in `?q=` via `nuqs`. URL-backed query is a real decision for the specification, and the prototype does not take a position on it.
- No analytics event on query, and the card hover background uses the local `accent` token (the reference uses its own `accent-muted`).

## Production files the prototype touches

`src/app/blog/page.tsx` (a `NODE_ENV`-gated branch on `?variant=`) and `src/modules/blog/index.ts` (three exports, needed because the repo lint rule forbids app code from reaching into a module's internals). Both are marked `PROTOTYPE — issue #32` and go away with this directory.

## Verdict

**Variant B — `?variant=b&align=meta-bottom&snippet=always&card=no-tags`.** Chosen by Levin on 2026-07-31.

In words, the accepted catalog composition is:

- The reference chrome unchanged: 48 rem lined rail with `pt-12`, tagline, 36 px title (with the local `py-2`), 36 px search field in its lined strip, two-column Cover grid at `sm` with the reference's guide-line pattern, 12 px grayscale Cover, `dd.MM.yyyy`.
- Tags are a **filter**, not card decoration: one lined strip under the search field, single-select facets with Article counts plus `All`. They do not appear on the card.
- The card is Cover, title, a two-line description, and the publication date. No updated date. Draft is a Badge pinned on the Cover.
- The description is always present and is replaced by the matching search snippet, highlighted, while a query is active — the card never changes shape.
- The card's meta is pinned to the bottom (`mt-auto`), so dates line up across a row however long the titles are.
- Loading, error, no-results and zero-Articles leave the grid behind for a centered `Empty` block.

### Open defect in the accepted combination

With `card=no-tags`, a Tag-only match has nothing to highlight. Measured: query `typescript` returns two cards with **zero** highlighted text, because the matched Tag label is not rendered on the card. This is the same "why is this here" problem that ruled out `snippet=never`, arriving through a different door.

Cheapest fix, if it is worth fixing: on result cards only, render the Tags that actually matched, highlighted. The browse view stays Tag-free; only a search result gains the chip that explains it. Not built — decide it on [Specify Blog catalog search and Tag interactions](https://github.com/levinbaenninger/website/issues/35).

### What happens to this directory

Issue #32 is planning-only and says not to implement production UI, so this prototype stays until the specification tickets have consumed it. Delete it, its two production hooks (`src/app/blog/page.tsx`, `src/modules/blog/index.ts`) and install `@shadcn/empty` for real in the implementation ticket that follows.
