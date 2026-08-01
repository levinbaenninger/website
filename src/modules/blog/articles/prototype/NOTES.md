# PROTOTYPE — Article reader and responsive navigation

Throwaway artifact for [issue #33](https://github.com/levinbaenninger/website/issues/33) on map [#30](https://github.com/levinbaenninger/website/issues/30). Delete this whole directory (and the two production hooks listed below) once the question is answered.

## Question

> What concrete reader composition best adapts Chánh Đại's Article page to Levin's dates, Tags, Draft state, and a table of contents that has to survive headings nested inside collapsed panels?

## What is _not_ variable

Everything the reference already answers is held identical across all three variants, per the map's "keep it exactly the same to the inspiration" instruction and the inventory in `docs/research/inventory-blog-ui-reference-and-component-foundations.md`. Measured in the running prototype at 1280:

- 48 rem lined rail (`md:w-3xl`, `border-x border-line`) — 768 px, `screen-line-*` strips above the action row, around the 16 px spacer, and under the title
- action row: `p-2 pl-4`, `← Blog` link at 28 px / `tracking-wider` / muted, action cluster of 28 px `secondary` icon buttons with no border
- title: 36/40 px, weight 500, `tracking-tight`, `text-balance`, lined bottom
- prose: 16/28 px body, `h2` 20 px, `h3` 18 px, `h4` 16 px, all weight 500 / `tracking-tight` / balanced, `px-4 pt-8`
- desktop grid `lg:grid-cols-[1fr_var(--container-3xl)_1fr]` — rail stays centred, the table of contents lives in the right gutter
- `--doc-cols-top` published on `<html>` as the bottom of the title (151 px here); the gutter column sticks at `calc(var(--doc-cols-top) + 12px)`, offset `translate-x-2`, and is invisible until the measurement exists so it cannot flash in at the wrong offset
- minimap: 72 px box hugging the right edge, `gap-3 py-3 pl-6`, lines `h-0.5` at 24 px (depth 2) / 16 px + `ml-2` (depth 3) / 8 px + `ml-4` (depth 4), `bg-ring/50` → `bg-foreground` when active over 200 ms
- heading list: 224 px, `px-6 py-4`, 14 px rows at `py-1`, depth indents 16 px / 32 px, `line-clamp-2`, muted → foreground, opens `side="left" sideOffset={-60} align="start"` while the minimap fades to 0
- active heading from an `IntersectionObserver` at threshold 0.9 with a nearest-heading fallback
- `←` / `→` move between neighbouring Articles, with the reference's tooltip + `Kbd` hint
- mobile "On this page" card: `lg:hidden`, rounded, inset ring, `TextIcon`, chevron rotating on open
- dates read `dd.MM.yyyy` with an ISO `dateTime`, as decided on #32

Markup for those parts is transposed from `ncdai/chanhdai.com` @ `83e0b842` (MIT, © Chánh Đại): `app/blog/[slug]/page.tsx`, `src/features/doc/components/doc-layout.tsx`, `doc-page-root.tsx`, `doc-share-menu.tsx`, `doc-keyboard-shortcuts.tsx`, `src/components/toc-minimap.tsx`, `toc-inline.tsx`.

## What the variants disagree about

The reference Article header carries a title and nothing else — no dates, no Tags, no Draft, and its toolbar's fourth control is a "copy page for an LLM" affordance this site has no use for. Those are the open places.

| Axis | A — Reference-strict | B — Lined meta header | C — Sticky reader toolbar |
| --- | --- | --- | --- |
| Description | first paragraph of the prose, muted — exactly where the reference puts it | own lined band under the title, 16/28 px, above the prose | same lined band, plus the title repeats in the sticky toolbar |
| Dates, Tags, Draft | a 14 px muted meta line immediately under that first paragraph, inside the prose column | second row of the lined band, so the prose starts on prose | second row of the lined band |
| Toolbar | reference exactly: back link left, actions right, scrolls away with the page | same | a second sticky bar under the site header: back arrow, truncated Article title, actions. Follows the reader the whole way down |
| Previous / next | two icon buttons in the toolbar, reference-style (`pager=toolbar`) | a titled two-cell pager after the prose (`pager=end`) | both (`pager=both`) |
| Table of contents | gutter minimap, hover to reveal (`toc=gutter-hover`) | gutter minimap, hover (`toc=gutter-hover`) | no minimap at all: a list button in the sticky toolbar opening the same 224 px list, identical at 390 px and 1280 px (`toc=toolbar`) |
| Share | dropdown menu, as the reference (`share=menu`) | dropdown menu | dialog with the URL visible and selectable (`share=dialog`) |

Trade-off to look for: A is the most faithful, and the price is a meta line wedged into the prose 14 px under the description — two different kinds of sentence in the same column. B buys a clean prose start with one lined band and a thinner toolbar, and its end pager costs a scroll to reach. C is the only one where the table of contents behaves the same way on a phone as on a desktop, and the price is a second sticky bar and losing the minimap, which is the most distinctive thing about the reference.

Every axis is independent of the variant, so any combination is reachable — the variant only sets the starting point.

## How to run it

```bash
vp run dev
```

- `http://localhost:3000/blog/understanding-cache-components?variant=a`
- `http://localhost:3000/blog/understanding-cache-components?variant=b`
- `http://localhost:3000/blog/understanding-cache-components?variant=c`

`[` / `]` cycle variants (not `←` / `→` — those belong to the Article pager under test). Every pill in the bottom bar cycles its axis on click and reverses on shift-click:

| Pill | Values | What it forces |
| --- | --- | --- |
| `body` | `long` · `short` · `none` · `panels` | 12 headings to depth 4 · 3 headings · no headings at all · headings inside an Accordion and Tabs |
| `state` | `published` · `updated` · `draft` | which dates and whether the Draft Badge appears |
| `nav` | `both` · `previous` · `next` · `none` | which neighbouring Articles exist |
| `pager` | `toolbar` · `end` · `both` | where previous/next lives |
| `share` | `menu` · `copy` · `dialog` | dropdown · a bare copy button · dialog with the visible URL |
| `focus` | `off` · `dim` · `hide` | whether the toolbar carries a reading-focus control, and what it does |
| `toc` | `gutter-hover` · `gutter-click` · `toolbar` | hover card · click-and-focus popover · toolbar button |
| `jump` | `pushstate` · `hash` · `reveal` | what a heading click does (see the finding below) |

`toc` and `jump` are disabled at `body=none`. The prototype only renders when `NODE_ENV !== "production"`; without `?variant=` the route renders the real `ArticleView`.

## What is real and what is fake

- Real: the shell rail, `Button` / `Badge` / `Tooltip` / `Kbd` / `Collapsible` / `InputGroup` / `CopyButton`, Radix `HoverCard` / `Popover` / `DropdownMenu` / `Dialog`, `.typeset`, the `useSound` tick, `@tanstack/react-hotkeys`, the `ArticleHeadingFact` shape, and — importantly — the **production** `ArticleAccordion` / `ArticleTabs` from `rendering/interactions.tsx`, including their `forceMount` + `hidden` panels and their `hashchange` reveal.
- Fake: the Article body. Fixture blocks in `fixtures.ts`, with ids generated by the same `github-slugger` pass the real compiler uses, so heading ids and the table of contents match what a real Article would produce. Title, description, Tags and slug come from the real Article; the dates are fixture values because the only Article in the repository is a Draft.
- Fake: the neighbouring Articles. There is one Article in the repository, so activating previous/next — by button, by pager cell, or by `←` / `→` — reports where it would go in a transient notice instead of navigating. Only the chrome is under test.
- Prototype-only: a thin skin on the Accordion and Tabs panels. The production components ship behaviour without a single class, so an unstyled panel reads as loose text and the "heading inside a collapsed panel" case is unjudgeable. Panel presentation is [#34](https://github.com/levinbaenninger/website/issues/34)'s question, not this one.

## Deviations from the reference inside the "held constant" set

- The minimap trigger is a `<button>`; the reference uses a plain `div`. Verified: the heading list now opens on keyboard focus as well as hover. Without it, the desktop table of contents is unreachable without a pointer.
- The mobile card's background is the reference's own `surface` token (zinc-50 / zinc-900), which this repository does not have — `muted` is too dark in light mode and `card` is pure white. The exact values are inlined as `oklch(0.985 0 0)` / `oklch(0.21 0.006 285.823)`. **A real token decision for the specification**, not something to inline in shipped code.
- The toolbar's fourth control is a reading-focus toggle where the reference has "copy page for an LLM". That substitution is what #33 asks for.
- No analytics on share or navigation.
- The end pager (B, C) has no reference at all — the reference Article ends at the prose.

## Production files the prototype touches

`src/app/blog/[slug]/page.tsx` (a `NODE_ENV`-gated branch on `?variant=`, so the real route stays statically prerendered — `searchParams` is only awaited outside production) and `src/modules/blog/index.ts` (two exports, needed because the repo lint rule forbids app code from reaching into a module's internals). Both are marked `PROTOTYPE — issue #33` and go away with this directory.

## Findings

**1. The reference's own table-of-contents click cannot reach a heading inside a collapsed panel.** This is the important one. The reference navigates with `history.pushState` plus `scrollIntoView`, which never fires `hashchange` — and `hashchange` is exactly what `rendering/interactions.tsx` listens for to open the Accordion or Tab that contains the target. Measured at `body=panels`, clicking "Enabling the flag" (a heading inside a closed Accordion item):

| `jump` | Result |
| --- | --- |
| `pushstate` (the reference) | URL updates, panel stays closed, **page does not move**. The reader is told nothing happened. |
| `hash` | Panel opens, page scrolls to the heading. Costs a history entry per click and an instant jump. |
| `reveal` | Panel is opened first, then `pushState` + smooth scroll. Correct behaviour, no extra history entry. |

`reveal` is the prototype-local version of what the real module would have to do. Whatever the specification picks, `pushstate` alone is not it.

**2. The minimap advertises headings that can never light up.** Panels are `forceMount`ed and `hidden`, so a heading inside a closed panel is in the DOM, gets a minimap line, and is in the list — but has a zero-height box, so the `IntersectionObserver` can never mark it active and `scrollIntoView` on it does nothing. At `body=panels` the minimap draws 7 lines for 4 reachable headings. Either the table of contents filters hidden headings, or clicking one has to open its panel (finding 1), or both.

**3. Accordion item titles are invisible to the table of contents.** Radix renders them inside an `AccordionPrimitive.Header` — an `h3` with no `id` — so they never enter `ArticleHeadingFact`. The fixture deliberately gives a panel a different title than the heading inside it so this is legible on screen. Probably correct, but it is a contract decision: a reader scanning the list will not see panel titles.

**4. `focus=hide` hides its own way out.** The focus toggle lives in the action row, and `hide` hides the action row, so once engaged the only way back is `Esc`. The tooltip says so, but the tooltip is gone too. `dim` has no such problem — it restores on hover or focus-within and the control stays visible at 25 %. If a focus mode ships, either it is `dim`, or `hide` needs an affordance that survives it.

**5. The meta line in A is tight.** 14 px between the description and the meta line at `-mt-2`, in the same column and both muted. It reads as one wrapped paragraph rather than two kinds of information. B and C do not have this problem because the band is lined.

**6. B's band leaves a 50 px hole.** The lined band's `py-4` plus the prose column's `pt-8` stack, so the first sentence starts 50 px below the line. Fixable in the specification by dropping the prose column's top padding when a band precedes it.

**7. The 224 px popover is a lot of a 390 px phone.** C's toolbar list works at mobile, but it covers most of the reading column. If the toolbar list ships, mobile probably wants a sheet rather than a popover.

## What Levin needs to decide

1. Which variant, i.e. where dates / Tags / Draft go and whether the toolbar sticks.
2. `pager` — icons in the toolbar (reference), a titled pager at the end, or both.
3. `share` — menu, bare copy, or dialog.
4. `focus` — ship one at all, and if so `dim` or `hide` (see finding 4).
5. `toc` — keep the reference minimap (and if so, hover or click), or move the list into the toolbar.
6. `jump` — the contract for reaching a heading inside a collapsed panel (finding 1), and whether hidden headings stay in the list at all (finding 2).

## Revision 1 — Levin's answer, 2026-08-01

The combination he settled on:

```
?variant=c&content=long&state=published&nav=both&pager=both&share=menu&focus=off&toc=gutter-click&jump=pushstate
```

C's sticky toolbar, the reference gutter minimap opened by click, previous/next in both places, the reference share menu, no focus mode. Ten points of feedback came with it. Each is below with what changed and where — **not everything is C-only**. Arrangement fixes stay in C so the three-way comparison still holds; defects in components all three variants share are fixed once, everywhere, because leaving A and B on a known-broken copy would distort the comparison more than the fix does.

### Applied to C only

**The doubled rule at the top of the page.** `screen-line-top` is a `::before` at `top: 0` and `screen-line-bottom` an `::after` at `bottom: 0`, so a lined strip stacked directly under another lined block draws two adjacent 1 px rules — 2 px of line, which is what reads as double. In C the sticky toolbar's bottom rule and the title spacer's top rule landed at 92–93 px and 93–94 px. The spacer now takes `screen-line-top-none`; the toolbar owns that rule, which is also the one that has to survive scrolling. A and B have no second bar and keep both rules.

**The back control names the destination, not the Article.** It was an icon button with the Article title beside it, which put the title on screen twice at the top of the page and made a back control claim it would go somewhere it does not. It is now the same `BackToBlog` button A and B use — one button, arrow and the word "Blog" — and the title is gone from the toolbar.

The cost is real and it changes what C is: NOTES.md's table calls C "the same lined band, plus the title repeats in the sticky toolbar", and without the title C is simply _the reference action row, made sticky_. Once the header has scrolled away, nothing on screen says which Article this is. If that matters, the shape that answers both complaints is a swap — "Blog" while the title is still visible, cross-fading to the title once it leaves the viewport. That was not built here.

**`focus=hide` got worse, and finding 4 needs updating.** That finding says `hide` collapses the action row and leaves `Esc` as the only way back. In C the bar it collapses used to carry the Article title as well; now the bar is nothing but the back control and the actions, and `in-data-[chrome=hide]:hidden` takes all of it — including the way back to the Blog. No code changed, and the accepted combination carries `focus=off`, but if a focus mode ever ships it is another argument for `dim`.

### Applied to B and C — both carry the lined band

**The 52 px hole above the first paragraph.** Finding 6 blamed `py-4` and `pt-8` stacking. That diagnosis was wrong. The padding is right; the extra 20 px is the first paragraph's own top margin. `.typeset` already cancels it — but its rule reaches two levels (`> :first-child > :first-child`), and in B and C the paragraph sits three deep, behind the body wrapper. A never had the problem because its description _is_ `.typeset`'s first child.

The column now corrects for it: `pt-3` where the prose opens the column, the full `pt-8` where the marginless "On this page" card does. Measured 32 px — the reference's distance — in all four reachable cases: 1280 and 390, with and without the card. **For the specification: the prose column should own its opening offset outright** instead of depending on how deep the first paragraph is nested.

**The metadata band's spacing.** The band was `py-4` with `gap-3` — 16 px outside, 12 px inside. Two distances that close read as ambiguous grouping, which is exactly the "feels off but I can't say why" signature. It is now `gap-2`: 8 px inside against 16 px outside, so the description and the meta row read as one block. The Tags list also carried an `ml-1` on top of the row's `gap-x-2`, putting the first Badge 12 px from the date where everything else in the row sat at 8. Removed.

The one thing left unequal is the title, which has no vertical padding at all and sits flush between its two rules while the band spends 16 px. That is the reference's own geometry and is held constant, so it was left alone — but it is the next thing to look at if the header still reads oddly.

### Applied to all three variants

**Inactive minimap lines are invisible in dark mode.** The reference draws them `bg-ring/50`, and this repository's `--ring` is `oklch(0 0 0)` — pure black — in _both_ themes, so in dark mode that is black on near-black. They are now `bg-muted-foreground`, the token that actually flips: L≈48 in light (within a hair of what `ring/50` was giving) and L≈66 against an L≈2.5 background in dark. Active stays `bg-foreground`.

**This is bigger than the minimap, and belongs in the specification, not here.** `--ring` is pure black in both themes, and it also drives `focus-visible:ring-ring/50` on every `Button` and the `outline: 2px solid var(--ring)` at `globals.css:164`. Every focus ring on the site is black-on-near-black in dark mode. Found while fixing this; not fixed here, because it is a token decision.

**No bottom padding under the last paragraph.** The prose column ended exactly on its last block, so the closing rule sat flush against the text. `pb-8` now gives 32 px, matching the 32 px it opens with. Not a mirror of `pt-8`: the first block carries a collapsed 20 px margin and the last carries nothing, so the optical gap is what was matched, not the padding value.

**Arrow-and-label gaps.** The back link was `gap-2` (8 px) and the end pager's "Previous" / "Next" rows `gap-1.5` (6 px). Now 6 px and 4 px.

**Share menu marks.** The trigger was `Share2Icon`, the three connected dots; it is now lucide's `ShareIcon`, the box with the arrow out of it. Both social items used that same generic mark; each target now carries its own, so the menu and the dialog stay one projection instead of drifting.

lucide ships no brand marks and the repository's own X and LinkedIn glyphs live in `src/modules/portfolio/about/social/icons/`, which the lint boundary forbids the Blog module from importing. Both are copied verbatim into `brand-icons.tsx` **as a prototype-local workaround**. The specification should promote them to `src/shared/ui/icons/` rather than duplicate them.

### Measured while checking, no change needed

The sticky toolbar does **not** cover a heading reached from the table of contents. `ProseColumn` sets `scroll-mt-16` (64 px) and C's fixed chrome is 92 px tall (48 px site header + 44 px toolbar), which looks like it should collide. It does not: `scrollIntoView` accounts for the heading's 35 px top margin as well, so headings land at y=112 against a toolbar bottom edge of 92. Twenty pixels of clearance — tight, but correct, and consistent across headings.

### Still open

Finding 1 (`jump`) and finding 2 (hidden headings in the list) are untouched: they are contract decisions for `rendering/interactions.tsx`, not layout, and the chosen combination still carries `jump=pushstate`, which is the setting that does nothing at all when the target sits inside a collapsed panel.

## Revision 2 — the sticky title, and reaching hidden headings

### The heading-inside-a-panel complaint is finding 1, and `jump=reveal` answers it

The combination under review carries `jump=pushstate`, which is exactly the value finding 1 records as doing nothing: `history.pushState` + `scrollIntoView` never fires `hashchange`, and `hashchange` is what `rendering/interactions.tsx` listens for. Switching that one axis fixes it. Measured at `content=panels`, clicking "Edge runtime" while the Node.js tab is selected:

| `jump` | Result |
| --- | --- |
| `pushstate` | URL updates, tab does not change, page does not move |
| `reveal` | Tab switches, heading resolves to 28 px tall and lands at y=112 |

**The accepted combination needs `jump=reveal`.** Nothing was built for this; the axis already existed to demonstrate it.

### New fixture case: two panels deep

The `panels` body gained a third tab, "Both", holding a closed Accordion with a depth-4 heading inside it — a heading behind two closed panels, which the fixture could express but never did. `reveal` handles it: the walk collects ancestors with `unshift`, so it opens outermost first, which is the only order that works because the inner control is not in the layout until the outer panel opens. Measured: both panels open, heading resolves to 24 px and lands at y=112.

One difference worth carrying into the specification: the prototype's `revealPanelsFor` schedules its scroll on a single `requestAnimationFrame`, where production's `revealCurrentArticleHash` uses two. Production is the more defensive of the two — opening a tab changes document height before the scroll resolves — and it is the one to keep.

### What the web platform offers, and what it does not

`hidden` means `display: none`, so a collapsed panel is invisible to more than the table of contents. The platform has two features aimed exactly at this:

- **`hidden="until-found"`** ([MDN][mdn-beforematch]) keeps a subtree in the layout tree but visually hidden and _findable_. When find-in-page or **fragment navigation** targets something inside it, the browser fires `beforematch` on the element, removes the `hidden` attribute, then scrolls. React 19 passes the string value through rather than coercing it to a boolean, so `hidden={open ? undefined : "until-found"}` is expressible, and a `beforematch` listener is the hook for putting Radix's state back in sync.
- **Auto-expanding `<details>`** ([whatwg/html#6466][details-pr]) is the same behaviour built into one element, no JavaScript at all.

Both were checked against what this Article reader actually needs:

**Neither one helps a table-of-contents click.** MDN is explicit that `scrollIntoView()` does not trigger `beforematch`, and `pushState` is not a fragment navigation either. Only a real fragment navigation or find-in-page does. So the reveal walk stays regardless; `until-found` is not a replacement for it.

**What it does fix is find-in-page**, which nothing currently covers: Ctrl+F today skips every collapsed panel, and that is the same defect wearing different clothes. Production already handles `hashchange` and first load through `scheduleArticleHashReveal`, so find-in-page is the only genuinely open path.

**Support is not there yet.** `hidden="until-found"` is Chrome 102 (May 2022), Firefox 148 (February 2026), and **not supported in Safari** on desktop or iOS — baseline blocked on Safari as of this writing ([web-features][wf]). So it is an enhancement over the JavaScript path, never a replacement.

**`<details>` only solves half of it.** A disclosure can be `<details>`; a Tabs group cannot, because tabs are one-of-N with a shared control strip and there is no native element for that. Adopting `<details>` for the Accordion would mean two different reveal mechanisms in one Article, which is worse than one that covers both.

**Recommendation for the specification ticket, not built here:** keep the reveal walk as the contract for table-of-contents clicks, and add `hidden="until-found"` plus a `beforematch` listener to `ArticleAccordion` and `ArticleTabs` as a progressive enhancement so find-in-page and external deep links work without JavaScript where the browser supports it. That change belongs in `rendering/interactions.tsx`, which is production code this prototype deliberately only reads — NOTES.md's "what is real" list depends on those panels being the real ones, and forking them here would make every panel finding unjudgeable.

[mdn-beforematch]: https://developer.mozilla.org/en-US/docs/Web/API/Element/beforematch_event
[details-pr]: https://github.com/whatwg/html/pull/6466
[wf]: https://web-platform-dx.github.io/web-features-explorer/features/hidden-until-found/

### Finding 2 does not go away

Reveal-on-click makes a hidden heading _reachable_, so keeping hidden headings in the list is now defensible — the list describes the Article, not the current viewport, and the prevailing practice of dropping them (Confluence, the Elementor and Beaver Builder table-of-contents widgets) is a workaround for not having a reveal contract at all.

The cost is unchanged and worth stating plainly: a heading inside a closed panel has a zero-height box, so the `IntersectionObserver` can never mark it active. At `content=panels` the minimap draws lines for headings that can never light up, and its progress indicator has permanent gaps until the reader opens something. Either that is accepted, or the list filters on measured height — which makes the list change shape as panels open.

### C's toolbar title, on a swap

Revision 1 removed the title from the sticky toolbar and noted the cost: past the header, nothing said which Article this was. The toolbar now carries both.

- The back control is unchanged and permanent — arrow, the word "Blog". It never becomes the title, which would re-create the complaint Revision 1 fixed and mutate its accessible name mid-scroll.
- The title is a separate element that fades in beside it over 200 ms once the real `h1` slides under the chrome, and fades back out on the way up.
- The trigger is an `IntersectionObserver` on the `h1` with `rootMargin: -92px` — the site header's 48 px plus the toolbar's 44 px — so the swap happens the moment the title stops being readable rather than when it leaves the viewport.
- The title is centred on the bar, not left in whatever space the back link leaves over. Equal `flex-1 basis-0` shoulders hold the back link and the action cluster; the title sits between them. Measured at 1280: the rail's content box runs 267–1011, centre 639, and the title's centre is 638. (Against the _border_ box the centre reads 635, because the reference's `p-2 pl-4` is deliberately asymmetric — 16 px left so the back link lines up with the prose gutter, 8 px right. A 3 px difference, and the content box is the one the eye reads.)
- It keeps its slot at every scroll position, showing or not, so the action cluster does not move as it appears. Measured: the cluster's left edge is 761 px at the top of the page and 761 px scrolled.
- `useReducedMotion()` swaps the cross-fade for a snap.
- At 390 px the shoulders bottom out at their content widths — the back link needs 50 px, the actions 100 px — so the title truncates and drifts 22 px left of centre (title centre 168, rail centre 190) rather than colliding with either side. The bar stays one 44 px row: back 25–75, title 83–254, actions 262–362. Centred where there is room, degrading in one direction where there is not, which is what a phone navigation bar does.

Now the top of the page says the title once, and every scroll position below it says the title too.

### The `jump` contract, settled

Answering question 6: **`reveal` is the contract, and `hidden="until-found"` goes on top of it as a progressive enhancement.** The two are not alternatives, and the reason is worth writing down precisely, because "Safari does not support it" sounds like a reason not to bother and is not one.

They cover different entry paths, and only one of them is optional:

| Entry path | Covered by | Works in Safari |
| --- | --- | --- |
| Table-of-contents click | `reveal` walk | yes |
| `hashchange`, first load with a hash | existing `hashchange` walk | yes |
| Find-in-page (Ctrl+F) | `hidden="until-found"` | no |
| External deep link, no JavaScript yet | `hidden="until-found"` | no |

`until-found` cannot replace the walk — `scrollIntoView()` does not fire `beforematch`, and `pushState` is not a fragment navigation — so the walk is load-bearing in every browser. And the walk cannot replace `until-found`, because find-in-page is a browser affordance that no amount of application JavaScript can hook.

**Adding it costs Safari nothing.** `hidden` is an enumerated attribute whose _invalid value default is the Hidden state_, and the HTML specification says so explicitly: "legacy user agents which don't support the Hidden Until Found state will have `display: none` instead of `content-visibility: hidden`". So in Safari `hidden="until-found"` renders exactly what `hidden` renders today — collapsed, not in the accessibility tree, not in the tab order. Safari readers keep the behaviour they have; Chrome and Firefox readers additionally get working Ctrl+F. There is no branch, no feature detection, and no fallback to write, because the fallback _is_ the current behaviour.

The shape of the production change, for the ticket that owns it:

- `ArticleAccordion` and `ArticleTabs` render `hidden={open ? undefined : "until-found"}` instead of a boolean. React 19 passes the string through rather than coercing it.
- Each panel listens for `beforematch` and sets its own React state open, so the browser stripping the attribute and Radix's state do not diverge on the next render.
- The `hashchange` walk stays exactly as it is, including its double `requestAnimationFrame`.
