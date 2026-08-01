# PROTOTYPE — the approved Article presentation language

Throwaway artifact for [issue #34](https://github.com/levinbaenninger/website/issues/34) on map [#30](https://github.com/levinbaenninger/website/issues/30). Delete this whole directory (and the two production hooks listed below) once the question is answered.

## Question

> What coherent visual and interaction system should present every already-approved Markdown and MDX construct inside an Article while matching the reference and preserving its semantic, server/client, and authoring contracts?

## The shape of the answer

**A presentation language is a stylesheet, not a component tree.** The production components already emit a complete styling surface — `data-slot="article-callout|article-cards|article-card|article-file|article-folder|article-steps|article-step|article-step-title"`, `data-code-block`, `data-line-numbers-start`, `data-twoslash`, `data-article-panel`, `data-article-accordion-trigger`, `data-kind`, `data-file-kind` — so all three languages live in one unlayered `language.css` keyed on `[data-article-language="a|b|c"]`. Nothing in `rendering/components.tsx` or `rendering/interactions.tsx` was touched, which is what #33 held to and what the map requires.

Unlayered is load-bearing: Tailwind v4 puts its utilities in `@layer utilities` and `.typeset` in `@layer components`, and an unlayered rule beats every layered rule regardless of specificity. That is how a stylesheet overrides components that ship their own classes (`ArticleCallout`, the shared `Card`, `Kbd`) without a single `!important` — except where Shiki writes an inline `style`, which is finding 3.

Three places genuinely need markup the production components do not emit, and each is a finding rather than a design choice: headings (finding 6), the code block's copy control (finding 4) and tables (finding 5). A fourth — the Accordion and Tabs panels — needs something the boundary itself breaks, which is finding 1.

## The specimen is real

Both specimens are `.mdx` compiled by the real pipeline — `next.config.ts` applies `createArticleMdxOptions` to every `.mdx` import — so the Shiki token spans, the Twoslash `rendererRich` markup, the GFM `contains-task-list`/`task-list-item` classes, the `data-copy-source` attributes and the `github-slugger` heading ids on screen are the ones a real Article produces. They pass the full `contract.ts` closed-language check.

They are imported from this directory, not added to `content/`, so `manifest.generated.ts`, the catalog, the search artifact, the sitemap and the social images are untouched. The import is dynamic, not static: `src/modules/blog/index.ts` re-exports this module and Vitest resolves that entrypoint's whole static graph without an MDX transform, so a static import fails every test that reaches the Blog entrypoint.

`specimen.mdx` carries every approved construct once, in reading order. `stress.mdx` carries the same language under nesting (Tabs → Accordion → code; Steps → Callout / CodeTabs / quote), overflow (a 1050 px table in a 734 px column, unbreakable inline code, code lines far wider than the rail, a file name that will not fit), long content, and degenerate shapes (stacked headings, a one-item Accordion, a one-Card grid, a list opening on a fence).

## What is _not_ variable

Everything the reference already answers is held identical across all three languages, per the map's "keep it exactly the same to the inspiration" instruction. Transposed from `ncdai/chanhdai.com` @ `83e0b842` (MIT, © Chánh Đại): `src/styles/globals.css` (`prose-ncdai`, `code-inline`, `link-underline`, `step`, `[data-rehype-pretty-code-figure]`), `src/components/callout.tsx`, `src/components/heading.tsx`, `src/components/mdx-code-block.tsx`, `src/components/ui/table.tsx`, `src/components/base/ui/tabs.tsx`. Measured in the running prototype at 1280 in a 734 px prose column:

- links: body weight, 1 px underline at 3 px offset, `currentColor / 30%` → `currentColor` on hover
- inline code: 1 px border, `muted / 50%`, `radius * 0.8`, 14 px, wraps rather than clips
- blockquote: one 1 px `line` rule, muted, upright, no quote marks
- `hr` on `line`; `ul` markers at `0.75em`, muted, sharing the text's line box
- headings: the reference's own anchor shape — the heading text _is_ the link, and a copy-link button fades in beside it
- tables: 14 px, a rule between every cell on `line`, none under the last row or after the last column, 8/12 px cells, `first:ps-0`, 150 px minimum cells inside a horizontal scroll container
- code frame: `radius * 1.4`, `surface`, 4 px padding, `inset 0 0 0 1px border/64`; `pre` 16 px block padding, no scrollbar; `.line` 16 px inline padding; 14/18 mono; inside a panel the fill drops to `background` so the frame stays a distinct object
- code title row: 10/12 px padding, mono, muted, truncating; with no title the control is lifted out of flow to the top-right and the lines gain 56 px of end padding, which is the reference's own geometry
- line numbers: sticky 64 px gutter, 24 px end padding, right-aligned, `code-number`
- highlight / word-highlight on `code-highlight`; focus blurs everything else 2 px and restores on hover
- Steps: 28 px indent with a `line` rule at `md`, 40 px and no rule below it; counter 24 px, `radius * 1.4`, `muted`, 13/24 regular
- Callout: the reference's one surface — `radius * 1.4`, `surface`, `inset-ring border/64`, no border; the mark is `1.15em` square, 12 px from the text, optically centred on the title's line box
- tab strips: 32 px, `radius`, `surface`, `inset-ring border/64`, 2 px padding; triggers `radius * 0.8`, 4/16 px, 14 px medium; the active one white in light and `muted` in dark, `inset-ring foreground/10`
- body typography: the `.typeset-blog` preset — 14 px, 1.75 leading, `--typeset-flow: 1em`. Every block in the language takes its leading margin from that one variable, so prose, lists, quotes, code, tables, Callouts, Cards, Files, Steps, Figures and tab groups all move together.

Two of those are deliberate departures from the reference rather than transpositions, and both are Levin's calls from the first review: the typeset preset (the reference sets 16/28 and `1.25em` of flow) and the table's column rules (the reference draws row rules only, which stops working on the seven-column table in `stress.mdx`). Code leading is a third: 14/18 against the reference's 14/20, because code is scanned in columns rather than read in lines.

Diff notation is the one held-constant item with no reference at all: the reference Blog never renders a diff, and a diff without colour is unreadable, so the conventional green/red plus a `+`/`-` gutter mark is used in all three rather than made an axis.

## What the languages disagree about

The reference answers prose, code and tab strips. It has **no Accordion, no Cards, no file tree, no MDX `Kbd`, no Figure-with-caption, no task lists, no Twoslash, and no Callout _kinds_** — its Callout is a single neutral surface that takes its icon from the author. Those are the open places, and the three languages are three consistent answers to all of them at once.

| Axis | A — Reference surfaces | B — Lined | C — Semantic tint |
| --- | --- | --- | --- |
| Thesis | every unanswered construct gets the reference's one surface recipe | every unanswered construct gets the shell's other idiom: rules, not fills | the documentation-site reading: kind means colour |
| Callout | one surface, `kind` picks the icon only | left rule, no fill, muted body | kind-tinted surface, ring, icon and title |
| Cards | Fumadocs' shape on `card`: boxed icon above a 14 px title, muted body | the same shape stripped to a lined grid with cell rules, no fill | Fumadocs' shape, plus `accent` on hover and coloured marks |
| Files | surface frame, plain rows | lined band with an indent guide rule | surface frame, coloured file-type marks, row hover |
| Accordion | surface panels, stacked with gaps | lined rows, flush, no fill | surface panels that take `accent` on hover |
| Figure | 14 px radius, inset ring | flush, top and bottom rules, no radius | as A |
| Tab strips | reference exactly | underline strip on `line` | reference exactly |

Cards are the one construct where the reference is not the model at all. Its `Card` is a docs-navigation tile it never uses in prose, and the first cut — shadcn's `Card` with the icon floated top-right — read badly at Article width. All three languages now take [Fumadocs' shape](https://www.fumadocs.dev/docs/markdown#cards): a small boxed mark above the title, a 14 px medium title, a muted 14 px body, and hover only when the Card is actually a link. They differ only in the frame around it.

A is the most faithful and the price is legibility under nesting: measured at `specimen=stress`, the Callout, the file tree, the Accordion and the tab strip all render the same fill — `lab(98.26 0 0)` in light, `lab(8.31 …)` in dark. Four different constructs, one flat surface, and inside a Tab panel three of them sit adjacent with no boundary between them. The code frame used to make it five; it now drops to `background` inside a panel, which is the same problem solved once rather than a reason to think A does not have it. B never has that problem and pays for it by having no way to say "this is an aside" other than a rule it shares with blockquotes. C is the deliberate deviation and should be chosen knowingly: **the reference carries no colour in prose anywhere**.

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

- **Real:** both specimens, compiled by the production pipeline through `contract.ts` and `code.ts`. Every Callout, Cards/Card, Files/Folder/File, Steps/Step, Accordion/AccordionItem, Tabs/Tab, CodeTabs, Figure, Kbd, link, list, quote, table cell, thematic break and task input on screen is the production component from `rendering/components.tsx` and `rendering/interactions.tsx` — `forceMount`, `hidden`, `hashchange` reveal and all.
- **Prototype-local, and each one is a finding:** `h2`–`h6` (no anchor exists in production), `pre` (production's copy control is a bare `<button>Copy</button>`), and `table` (production emits no scroll wrapper).
- **The body renders client-side**, which production does not do. That is finding 1, not a shortcut: the server path renders the panels empty. It costs nothing visually — Shiki, Twoslash, the GFM classes and the contract all run at compile time, so the markup is byte-identical either way — and the frontmatter and heading facts are still read on the server, where the table of contents needs them.
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

`ArticleAccordion` selects its children with `child.type === ArticleAccordionItem`, and `ArticleTabs` does the same with `ArticleTab`. That comparison holds when the whole tree is client code — which is how #33's prototype and `interactions.dom.test.tsx` exercise them, and why it has never been caught. It does **not** survive the server/client boundary, and `ArticleView` is a plain server component that renders `<Content />` with the registry wired through `src/mdx-components.tsx`. Every child is filtered out.

This was verified on the real route, not inferred from the prototype. An `Accordion` and a `Tabs` were appended to `content/understanding-cache-components`, `/blog/understanding-cache-components` was requested with no prototype parameters, and the probe was reverted. The Article renders:

```html
<div data-orientation="vertical"></div>
<div dir="ltr" data-orientation="horizontal"><div role="tablist" …></div></div>
```

Zero `data-article-accordion-trigger`, zero `role="tab"`, zero `data-article-panel`. The authored text survives only in the Flight payload. Against the same panels rendered client-side by #33's prototype:

| Route | Accordion panels | Tab panels |
| --- | --- | --- |
| `?variant=a&content=panels` (#33, client all the way down) | 3 | 3 |
| `/blog/understanding-cache-components` (the real Article, probed) | 0 | 0 |
| `?language=a` rendered on the server (this prototype, first cut) | 0 | 0 |

The first cut tried to bridge it: a client component that read `child.props` and re-created each child with the reference the client module actually holds. **That does not work either, and the reason sharpens the finding.** Across the RSC boundary a child is not a plain element at all — during SSR it is still an unresolved lazy reference, so `isValidElement` is `false`; after hydration the module is loaded and it is `true`. The bridge therefore rendered an empty tab strip on the server and a full one on the client, i.e. a hydration mismatch stacked on top of the original defect:

> Hydration failed because the server rendered HTML didn't match the client. `at ArticleTabs (src/modules/blog/rendering/interactions.tsx:205:14)`

So the prototype stopped rendering the body on the server. `specimen-content.tsx` renders it inside one client module graph, where the production components behave exactly as `interactions.dom.test.tsx` exercises them. That costs nothing visually — Shiki, Twoslash and the contract all run at compile time — and the defect is already proven on the real route, so there is nothing left for the prototype to reproduce.

The production fix belongs in `rendering/interactions.tsx`: **stop introspecting children entirely.** Dropping the identity filter is not enough, because `isValidElement` is itself unreliable here. `contract.ts` already guarantees only `AccordionItem` children under `Accordion` and only `Tab` under `Tabs`, so the panel data has to come from somewhere the boundary cannot mangle — a compiler-supplied prop, or `AccordionItem`/`Tab` rendering their own markup and the parent coordinating through context instead of reading `props.children`.

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

**12. Nothing marks an external destination.** `ArticleLink` already sets `target="_blank"` and `rel="noopener noreferrer"` on every `https://` href, so the information exists — it just never reaches the reader. The prototype draws the mark with a CSS mask on `a[target="_blank"]`, which is enough to judge it and not enough to ship: a mask is invisible to assistive technology, so the component has to carry a real icon with an accessible name.

**13. `ArticleTabs` emits no slot attribute.** Radix's `Tabs.Root` renders a bare `<div dir data-orientation>`, so there is nothing to select it by — which is why a `Tabs` placed directly after an `Accordion` had no gap at all: every other block in the language owns its own leading margin and the tab root owned none. The prototype matches it structurally (`div[dir]:has(> [role="tablist"])`). Presentation should not have to guess at shape; `ArticleTabs` should emit `data-slot`, as every other Blog component already does.

## What was verified, and what was not

Measured at 1280 in light: both specimens, all three languages, every axis value, both Twoslash states, all six annotation kinds, the sticky line-number gutter under horizontal scroll, panel nesting two deep, and the 1050 px table. `vp check`, `vp test` and `vp run build` all pass, and `/blog/[slug]` is still prerendered.

Measured in dark: all three languages, on a page loaded with `localStorage.theme = "dark"` and a fresh document. A class toggle mid-session is **not** reliable in this harness — it produced one phantom result that took a while to unpick — so every dark number here comes from a page that rendered dark from the start. A's six surfaces, B's rules, C's four tints, both Shiki themes and the `--surface` / `--code-*` tokens all flip correctly.

One thing worth knowing about B in dark: its rules resolve to `oklab(0.271 … / 0.424)` over an `L≈2.5` background, i.e. an effective lightness around 13. Visible, but faint. That is `--line` behaving exactly as the shell defines it and the reference defines it, not a defect — but B is the language that leans on `--line` for everything, so it is the one where the token's dark weight actually decides legibility.

Not measured: **the `md` and `lg` breakpoint branches at a real 390 px viewport.** The automation harness in this session could not resize the browser. What was measured instead is a 327 px prose column at a 1280 px viewport, which exercises wrapping and overflow — nothing escapes the rail, code and tables scroll, tab strips fit — but leaves the Steps `md:` rule, the Cards `sm:` grid and the `lg:` table-of-contents switch unchecked. **Worth a look at 390 px before deciding.**

`motion=reduced` reaches CSS transitions only. The shared `CopyButton` animates through `motion/react` and follows the real media query, so its reduced branch needs the OS setting.

## Production files the prototype touches

`src/app/blog/[slug]/page.tsx` (a `NODE_ENV`-gated branch on `?language=`, ahead of #33's `?variant=` branch; `searchParams` is still only awaited outside production so the real route stays statically prerendered) and `src/modules/blog/index.ts` (two exports, needed because the repo lint rule forbids app code from reaching into a module's internals). Both are marked `PROTOTYPE — issue #34` and go away with this directory.

## What Levin needs to decide

1. Which language — A, B or C — i.e. whether the constructs the reference never had to answer for get its one surface, the shell's rules, or semantic colour.
2. `anchor` — the reference's whole-heading link, a leading `#`, or no anchor; and whether the copy-link control may be hover-only given finding 6.
3. `copy` — hover (the reference), always, or coarse-pointer-and-focus, given finding 4.
4. Whether `Callout.kind` earns colour (finding 7), independently of 1 — C's tints can be grafted onto A.
5. Whether findings 1, 2, 3, 9, 10 and 13 are folded into the #37 specification or split out as infrastructure defects against `interactions.tsx`, `code.ts` and `contract.ts`. Finding 1 in particular is shipping-broken today, not a design question.
6. Whether the `.typeset-blog` preset holds at Article length (Revision 1) — it is the one change that moves everything at once, and it is a departure from the reference rather than a transposition.

## Revision 1 — Levin's first review

Thirteen points of feedback. Everything below is applied to **all three languages**, because none of it is an axis: a control with no feedback, a marker sitting low, or an unreachable Twoslash popup is broken in A, B and C alike. Where a fix needed markup rather than CSS it became a finding, and the findings list above grew from eleven to thirteen.

**The tabs were not a styling problem.** They were empty, and the compiler error came with them. This turned out to be finding 1 wearing a second face: the bridge that re-created panel children across the RSC boundary works after hydration and not during SSR, because a child arriving from the server is an unresolved lazy reference rather than an element — so `isValidElement` is `false` on the server and `true` on the client, and the server rendered an empty tab strip into a client that rendered a full one. The body now renders inside one client module graph and the bridge is gone. Finding 1 is rewritten around this; it is a stronger statement than the first cut made, and it changes the recommended production fix from "drop the identity filter" to "stop reading `props.children` at all".

**Applied as CSS, in the held-constant set:**

- **The copy control kept its feedback.** Both the heading anchor's and the code block's stay visible while `data-state` is not `idle`, so the copied/failed state survives the pointer leaving.
- **List markers and task checkboxes sat low.** Both were tuned for a tighter leading than 1.75. The marker now takes `line-height: inherit` so it shares the text's line box; the checkbox is centred with `calc((1em - 1lh) / 2 + 0.2em)` rather than the stock `-0.1em`.
- **The Callout mark.** 12 px from the text rather than 8, sized `1.15em` against the title's cap height rather than a flat 16 px, and optically centred on the title's line box — shadcn's `Alert` proportions rather than a fixed nudge. A Callout with no title no longer spans two grid rows.
- **Cards are Fumadocs' shape now.** Boxed 24 px mark above the title, 14 px medium title, muted 14 px body, `card` fill on `border`, hover only when the Card is a link.
- **Spacing.** The `.typeset-blog` preset is in — 14 px, 1.75, `--typeset-flow: 1em` — and every block in the language now takes its leading margin from that one variable instead of a hard-coded `1.25em`. That is what fixes both "a list has too much spacing at the top" and the same gap above code blocks, and it makes the whole rhythm one number to turn.
- **Tables gained column rules.** A rule between every cell, none after the last column.
- **Code leading is 14/18**, down from the reference's 14/20.
- **Twoslash popups escape the frame.** The scrolling `pre` clipped them and grew its scrollable area instead, so the popup ended up below the code behind a scrollbar. There is no `overflow-x: auto` with `overflow-y: visible` — the axes are locked — so the frame stops clipping while a token is hovered and starts again when it is not. The popup also gained `z-index: 20`.
- **Twoslash `^?` queries and error lines align with the code**, 16 px in, or 64 px where a line-number gutter is present. They were starting at the code element's edge.
- **External links carry a mark** (finding 12).
- **A code frame inside a panel drops to `background`**, so it stops sharing the panel's own fill.
- **A `Tabs` directly after an `Accordion` has a gap** (finding 13).

**Not applied, and worth saying why:** the `script` tag warning in `ThemeProvider` comes from `next-themes` writing its blocking theme script, and predates this prototype — it appears on every route.
