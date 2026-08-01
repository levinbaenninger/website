# PROTOTYPE — the approved Article presentation language

Throwaway artifact for [issue #34](https://github.com/levinbaenninger/website/issues/34) on map [#30](https://github.com/levinbaenninger/website/issues/30). Delete this whole directory (and the two production hooks listed below) once the question is answered.

## Question

> What coherent visual and interaction system should present every already-approved Markdown and MDX construct inside an Article while matching the reference and preserving its semantic, server/client, and authoring contracts?

## The shape of the answer

**A presentation language is a stylesheet, not a component tree.** The production components already emit a complete styling surface — `data-slot="article-callout|article-cards|article-card|article-file|article-folder|article-steps|article-step|article-step-title"`, `data-code-block`, `data-line-numbers-start`, `data-twoslash`, `data-article-panel`, `data-article-accordion-trigger`, `data-kind`, `data-file-kind` — so all three languages live in one unlayered `language.css` keyed on `[data-article-language="a|b|c"]`. Nothing in `rendering/components.tsx` or `rendering/interactions.tsx` was touched, which is what #33 held to and what the map requires.

Unlayered is load-bearing: Tailwind v4 puts its utilities in `@layer utilities` and `.typeset` in `@layer components`, and an unlayered rule beats every layered rule regardless of specificity. That is how a stylesheet overrides components that ship their own classes (`ArticleCallout`, the shared `Card`, `Kbd`) without a single `!important` — except where Shiki writes an inline `style`, which is finding 3.

Four places genuinely need markup the production components do not emit, and each is a finding rather than a design choice: headings (finding 6), the code block's copy control (finding 4), tables (finding 5), and the Accordion/Tabs hand-off across the server boundary (finding 1).

## The specimen is real

Both specimens are `.mdx` compiled by the real pipeline — `next.config.ts` applies `createArticleMdxOptions` to every `.mdx` import — so the Shiki token spans, the Twoslash `rendererRich` markup, the GFM `contains-task-list`/`task-list-item` classes, the `data-copy-source` attributes and the `github-slugger` heading ids on screen are the ones a real Article produces. They pass the full `contract.ts` closed-language check.

They are imported from this directory, not added to `content/`, so `manifest.generated.ts`, the catalog, the search artifact, the sitemap and the social images are untouched. The import is dynamic, not static: `src/modules/blog/index.ts` re-exports this module and Vitest resolves that entrypoint's whole static graph without an MDX transform, so a static import fails every test that reaches the Blog entrypoint.

`specimen.mdx` carries every approved construct once, in reading order. `stress.mdx` carries the same language under nesting (Tabs → Accordion → code; Steps → Callout / CodeTabs / quote), overflow (a 1050 px table in a 734 px column, unbreakable inline code, code lines far wider than the rail, a file name that will not fit), long content, and degenerate shapes (stacked headings, a one-item Accordion, a one-Card grid, a list opening on a fence).

## What is _not_ variable

Everything the reference already answers is held identical across all three languages, per the map's "keep it exactly the same to the inspiration" instruction. Transposed from `ncdai/chanhdai.com` @ `83e0b842` (MIT, © Chánh Đại): `src/styles/globals.css` (`prose-ncdai`, `code-inline`, `link-underline`, `step`, `[data-rehype-pretty-code-figure]`), `src/components/callout.tsx`, `src/components/heading.tsx`, `src/components/mdx-code-block.tsx`, `src/components/ui/table.tsx`, `src/components/base/ui/tabs.tsx`. Measured in the running prototype at 1280 in a 734 px prose column:

- links: body weight, 1 px underline at 3 px offset, `currentColor / 30%` → `currentColor` on hover
- inline code: 1 px border, `muted / 50%`, `radius * 0.8`, 14 px, wraps rather than clips
- blockquote: one 1 px `line` rule, muted, upright, no quote marks
- `hr` on `line`; `ul` markers at 12 px/1
- headings: the reference's own anchor shape — the heading text _is_ the link, and a copy-link button fades in beside it
- tables: 14 px, one rule per row on `line`, none under the last, `p-2`, `first:ps-0`, 150 px minimum cells inside a horizontal scroll container
- code frame: `radius * 1.4`, `surface`, 4 px padding, `inset 0 0 0 1px border/64`; `pre` 16 px block padding, no scrollbar; `.line` 16 px inline padding; 14/20 mono
- code title row: 10/12 px padding, mono, muted, truncating; with no title the control is lifted out of flow to the top-right and the lines gain 56 px of end padding, which is the reference's own geometry
- line numbers: sticky 64 px gutter, 24 px end padding, right-aligned, `code-number`
- highlight / word-highlight on `code-highlight`; focus blurs everything else 2 px and restores on hover
- Steps: 28 px indent with a `line` rule at `md`, 40 px and no rule below it; counter 24 px, `radius * 1.4`, `muted`, 13/24 regular
- Callout: the reference's one surface — `radius * 1.4`, `surface`, `inset-ring border/64`, no border
- tab strips: 32 px, `radius`, `surface`, `inset-ring border/64`, 2 px padding; triggers `radius * 0.8`, 4/16 px, 14 px medium; the active one white in light and `muted` in dark, `inset-ring foreground/10`

Diff notation is also held constant, and it is the one held-constant item with no reference at all: the reference Blog never renders a diff, and a diff without colour is unreadable, so the conventional green/red plus a `+`/`-` gutter mark is used in all three rather than made an axis.

## What the languages disagree about

The reference answers prose, code and tab strips. It has **no Accordion, no Cards, no file tree, no MDX `Kbd`, no Figure-with-caption, no task lists, no Twoslash, and no Callout _kinds_** — its Callout is a single neutral surface that takes its icon from the author. Those are the open places, and the three languages are three consistent answers to all of them at once.

| Axis | A — Reference surfaces | B — Lined | C — Semantic tint |
| --- | --- | --- | --- |
| Thesis | every unanswered construct gets the reference's one surface recipe | every unanswered construct gets the shell's other idiom: rules, not fills | the documentation-site reading: kind means colour |
| Callout | one surface, `kind` picks the icon only | left rule, no fill, muted body | kind-tinted surface, ring, icon and title |
| Cards | surface cards in a 2-column grid | a lined grid with cell rules, no fill | surface cards that take `accent` on hover |
| Files | surface frame, plain rows | lined band with an indent guide rule | surface frame, coloured file-type marks, row hover |
| Accordion | surface panels, stacked with gaps | lined rows, flush, no fill | surface panels that take `accent` on hover |
| Figure | 14 px radius, inset ring | flush, top and bottom rules, no radius | as A |
| Tab strips | reference exactly | underline strip on `line` | reference exactly |

A is the most faithful and the price is legibility under nesting: measured at `specimen=stress`, a Callout, a file tree and a code block inside one Tab panel all render `oklch(0.985 0 0)` — three different constructs, one flat surface, no boundary between them. B never has that problem and pays for it by having no way to say "this is an aside" other than a rule it shares with blockquotes. C is the deliberate deviation and should be chosen knowingly: **the reference carries no colour in prose anywhere**.

Every axis follows its language; the four independent pills below are orthogonal to all three.

## How to run it

```bash
vp run dev
```

- `http://localhost:3000/blog/understanding-cache-components?language=a`
- `http://localhost:3000/blog/understanding-cache-components?language=b`
- `http://localhost:3000/blog/understanding-cache-components?language=c`

`[` / `]` cycle the language. Every pill in the bottom bar cycles its axis on click and reverses on shift-click:

| Pill | Values | What it forces |
| --- | --- | --- |
| `specimen` | `full` · `stress` | every construct once · nesting, overflow, long content, degenerate shapes |
| `anchor` | `wrap` · `leading` · `none` | the reference's whole-heading link · a leading `#` · no anchor at all |
| `copy` | `hover` · `always` · `focus-coarse` | the reference's hover-only control · always visible · visible on coarse pointers |
| `motion` | `system` · `reduced` | follow the OS · force the reduced branch |

The key is `language=`, not `variant=`: `?variant=` still mounts #33's reader prototype, and both have to be reachable while #34 is open. The prototype only renders when `NODE_ENV !== "production"`; without `?language=` the route falls through to `?variant=` and then to the real `ArticleView`.

## What is real and what is fake

- **Real:** both specimens, compiled by the production pipeline through `contract.ts` and `code.ts`. Every Callout, Cards/Card, Files/Folder/File, Steps/Step, CodeTabs, Figure, Kbd, link, list, quote, table cell, thematic break and task input on screen is the production component from `rendering/components.tsx`, and the Accordion and Tabs panels are the production ones from `rendering/interactions.tsx` — `forceMount`, `hidden`, `hashchange` reveal and all.
- **Prototype-local, and each one is a finding:** `h2`–`h6` (no anchor exists in production), `pre` (production's copy control is a bare `<button>Copy</button>`), `table` (production emits no scroll wrapper), and the `Accordion`/`Tabs` hand-off (finding 1).
- **Chrome:** #33's accepted composition, reduced to the pieces the prose column has to be judged inside — the lined rail, the sticky toolbar with the title cross-fade, the title, the metadata band, the gutter minimap opened by click, the mobile "On this page" card. Share, previous/next and the focus control are left out; they say nothing about what an Article reads like. The chrome primitives are imported from `articles/prototype/` rather than re-derived, so the rail width, the opening offset and the `--doc-cols-top` measurement stay the ones #33 measured. **The two directories therefore have to be deleted together.**
- **Blog-local tokens:** `--surface`, `--surface-foreground`, `--code`, `--code-number`, `--code-highlight` do not exist in this repository. They are defined in `language.css` and are a specification input, not something to inline in shipped code. The surface pair reuses the exact values #33 already inlined for its mobile card, so the tree carries one definition and not two.

## Deviations from the reference inside the "held constant" set

- The reference's `--ring` is zinc-400; this repository's is pure black in **both** themes. #33 already found and escalated this; here it lands on the heading anchor's focus ring and the tab triggers' `focus-visible` ring. Not re-litigated.
- Callout icons are CSS masks keyed on `data-kind`, because `ArticleCallout` renders no icon at all (finding 7).
- The Accordion chevron is drawn in CSS, because `ArticleAccordion` renders no disclosure mark (finding 8).
- The reference's tab strip has an animated `Tabs.Indicator` element. Neither of this repository's tab implementations renders one, so the active state is a background on the trigger instead of a sliding indicator.
- Twoslash has no reference at all. `@shikijs/twoslash/style-rich.css` is imported and its variables are re-pointed at this repository's tokens.

## Findings

**1. `Accordion` and `Tabs` render empty in production today.** This is the important one, and it is not a presentation question.

`ArticleAccordion` selects its children with `child.type === ArticleAccordionItem`, and `ArticleTabs` does the same with `ArticleTab`. That holds when the whole tree is client code — which is how #33's prototype and `interactions.dom.test.tsx` exercise them. It does **not** hold when the Article renders as a server component, which is exactly what `ArticleView` does: the server holds a _client reference_ for `AccordionItem`, and a client reference is never `===` the function the client component compares against. Every child is filtered out.

Measured on the same panels:

| Route | Accordion panels | Tab panels |
| --- | --- | --- |
| `?variant=a&content=panels` (#33, client all the way down) | 3 | 3 |
| `?language=a` without the bridge (server-rendered, production path) | 0 | 0 |

`panels.tsx` re-creates each child with the reference the client module actually holds, so the panels below are still the production components. The production fix belongs in `rendering/interactions.tsx`: drop the identity filter — `contract.ts` already guarantees only `AccordionItem` children under `Accordion` and only `Tab` under `Tabs`, so accepting every valid element child is both sufficient and boundary-safe.

**2. Dark-mode code blocks render the light theme.** `code.ts` compiles with a light/dark theme pair, and Shiki emits `--shiki-dark` on every token — but nothing in this repository consumes it. There is no `.dark .shiki { color: var(--shiki-dark) }` anywhere. `language.css` adds it; without that rule every code block on the site is `github-light` in dark mode.

**3. Shiki writes the background as an inline style.** Every `pre` carries `style="background-color: rgb(255,255,255); --shiki-dark-bg: #24292e; …"`, so a framed container cannot win without `!important` — the one `!important` in the file. The specification's answer is `defaultColor: false` in the `rehypeShikiFromHighlighter` options, which moves both themes to CSS variables and lets the container own the surface.

**4. The code copy control is a bare `<button>Copy</button>`.** `rendering/copy-button.tsx` has no icon, no copied/error state, no live region, no sound, no reduced-motion branch — while `src/shared/ui/copy-button.tsx` has all of them and is already used by the rest of the site. The prototype's `pre` uses the shared one. Related: the `copy` axis exists because the reference's own answer is `opacity-0 group-hover`, and #31's acceptance checklist says no copy control may be hover-only.

**5. Tables do not scroll.** `ArticleTable` renders a bare `<table>`, and `.typeset` makes a bare table shrink to fit rather than scroll — so a wide table compresses its columns instead of overflowing. The reference wraps it. `.typeset-scroll` is this repository's own answer and cannot be applied from CSS because it needs a wrapper element. Measured at `specimen=stress`: with the wrapper, a 7-column table is 1050 px inside a 734 px column and scrolls; without it, it wraps into unreadable columns.

**6. Headings carry no anchor affordance.** `ArticleHeading2`–`ArticleHeading6` render a bare tag with the compiled id. The reference makes the heading text itself the link and fades a copy-link button in on hover. Same accessibility problem as finding 4, hence the `anchor` axis.

**7. `Callout.kind` maps to nothing visual.** It reaches the DOM as `data-kind` and stops there — no icon, no colour, no variant. A closed four-value enum that produces four identical Callouts is not a contract worth having; the presentation has to give it a mark (A and B) or a mark and a colour (C).

**8. `ArticleAccordion` renders no disclosure mark.** A trigger with no chevron reads as a heading, not a control. Drawn in CSS here; belongs in the component.

**9. Tabbed code fences inside Steps, Tabs or Accordion silently degrade.** `validateAndGroupCode` annotates every fence recursively but groups only `root.children`, so a `tab="…" tab-group="…"` run nested inside a JSX element never becomes `CodeTabs` — and the `code-tabs-size` and `code-tabs-boundary` diagnostics never fire there either. Measured in the compiled `stress.mdx`: `data-code-tab-label` appears twice, `CodeTabs` zero times, and the two fences render as independent code blocks whose tab labels are simply discarded. Either grouping recurses, or authoring a tabbed run inside a Step has to be a contract error.

**10. Twoslash popups get wrapped in the Article code frame.** `pre` is a global MDX mapping, and `rendererRich` emits its own `<pre>` inside hover popups — so a popup contains a full `figure[data-code-block]` with the surface, the ring and the 4 px padding, but no caption. Measured: one nested frame inside a popup in `specimen.mdx`. The specification needs `ArticleCodeBlock` to leave Twoslash's own markup alone.

**11. `.typeset` fights the reference in four specific places**, all handled in `language.css` and all worth writing into the specification rather than rediscovering: `pre` (`bg-muted`, radius, `.75em 1em` padding), `kbd` (a border and a 2 px bottom border on top of the shared `Kbd`), `table` (wrap, not scroll), and links (weight 500 against the reference's body weight).

## What was verified, and what was not

Measured at 1280 in light and in a genuinely dark render (`localStorage.theme = "dark"`, fresh document — a class toggle mid-session is not reliable in this harness): both specimens, all three languages, every axis value, both Twoslash states, all six annotation kinds, the sticky line-number gutter under horizontal scroll, panel nesting two deep, and the 1050 px table.

Not measured: **the `md` and `lg` breakpoint branches at a real 390 px viewport.** The automation harness in this session could not resize the browser. What was measured instead is a 327 px prose column at a 1280 px viewport, which exercises wrapping and overflow — nothing escapes the rail, code and tables scroll, tab strips fit — but leaves the Steps `md:` rule, the Cards `sm:` grid and the `lg:` table-of-contents switch unchecked. **Worth a look at 390 px before deciding.**

`motion=reduced` reaches CSS transitions only. The shared `CopyButton` animates through `motion/react` and follows the real media query, so its reduced branch needs the OS setting.

## Production files the prototype touches

`src/app/blog/[slug]/page.tsx` (a `NODE_ENV`-gated branch on `?language=`, ahead of #33's `?variant=` branch; `searchParams` is still only awaited outside production so the real route stays statically prerendered) and `src/modules/blog/index.ts` (two exports, needed because the repo lint rule forbids app code from reaching into a module's internals). Both are marked `PROTOTYPE — issue #34` and go away with this directory.

## What Levin needs to decide

1. Which language — A, B or C — i.e. whether the constructs the reference never had to answer for get its one surface, the shell's rules, or semantic colour.
2. `anchor` — the reference's whole-heading link, a leading `#`, or no anchor; and whether the copy-link control may be hover-only given finding 6.
3. `copy` — hover (the reference), always, or coarse-pointer-and-focus, given finding 4.
4. Whether `Callout.kind` earns colour (finding 7), independently of 1 — C's tints can be grafted onto A.
5. Whether findings 1, 2, 3, 9 and 10 are folded into the #37 specification or split out as infrastructure defects against `interactions.tsx`, `code.ts` and `contract.ts`. Finding 1 in particular is shipping-broken today, not a design question.
