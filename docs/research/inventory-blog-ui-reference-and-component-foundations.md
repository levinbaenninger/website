# Inventory the Blog UI reference and component foundations

Research for [Inventory the Blog UI reference and component foundations](https://github.com/levinbaenninger/website/issues/31), captured on 2026-07-30.

## Decision

Use Chánh Đại’s current Blog as a **visual and interaction reference**, not as an installable Blog implementation. Inherit its centered lined rail, two-column Cover-card catalog, compact search field, 36 px display headings, 16/28 px Article prose, framed code blocks, desktop TOC minimap, and collapsible mobile TOC. Build those surfaces as Blog-owned compositions over this repository’s existing shell, Radix/Nova shadcn primitives, Article projections, Fuse search service, MDX contract, and code renderer.

Do not install either `@ncdai/blog-01` or `@ncdai/blog-02`. The latter is the closest catalog seed, but it contains hard-coded sample data, three columns at `md`, remote images, and a registry-wide style dependency rather than this repository’s Article and feature contracts. Likewise, do not install `@ncdai/typography`, `@ncdai/copy-button`, or `@ncdai/code-block-command`: this repository already owns stronger equivalents, and those entries would add duplicate styling or dependencies. Treat `@ncdai/toc-minimap` and `@ncdai/share-menu` as attributed behavioral seeds to adapt, not drop-in installs. [`blog-02` registry item](https://chanhdai.com/r/blog-02.json); [`toc-minimap` registry item](https://chanhdai.com/r/toc-minimap.json); [`share-menu` registry item](https://chanhdai.com/r/share-menu.json); [`typography` registry item](https://chanhdai.com/r/typography.json).

The only plausible later registry additions are product-neutral `@shadcn/dropdown-menu`, `@shadcn/hover-card`, and `@shadcn/table`, if the implementation ticket confirms they are still absent. The configured `@shadcn` registry also contains `input-group`, `badge`, `tabs`, `accordion`, and `sonner`, but the first two are already installed and the Blog already has tested Radix-backed tabs and accordions. No component or dependency was installed during this research. [Configured registries](../../components.json); [installed dependencies](../../package.json); [Blog MDX interactions](../../src/features/blog/rendering/interactions.tsx).

## Evidence boundary

The conclusions distinguish three evidence classes:

- **Live-observed:** `https://chanhdai.com/blog` was inspected in light and dark at a 1280×800 desktop viewport and a 390×844 mobile viewport. The code-heavy `awesome-terminal` Article was inspected in both themes at desktop and at 390×844, including the expanded mobile TOC. Measurements below are CSS-pixel browser measurements from those sessions. [Live Blog](https://chanhdai.com/blog); [live representative Article](https://chanhdai.com/blog/awesome-terminal).
- **Source-traced:** behavior was traced to `ncdai/chanhdai.com` commit [`83e0b842ba67b185f59f0977bc854726a32b32c3`](https://github.com/ncdai/chanhdai.com/commit/83e0b842ba67b185f59f0977bc854726a32b32c3), committed at 2026-07-30 06:12:57 UTC. This pin matters because the live site and registry are actively changing.
- **Repository-local:** compatibility claims come from the checked-in shell, UI primitives, Blog projections, search service, and rendering contract in this repository, not from assumptions about the intended implementation. [Feature-first architecture ADR](../adr/0002-adopt-a-feature-first-application-architecture.md).

## Reference tokens and visual measurements

### Color and surface tokens

The upstream site uses the same zinc/OKLCH family as this repository. Its main reference values are:

| Token | Light | Dark | Decision here |
| --- | --- | --- | --- |
| `background` / `foreground` | `oklch(1 0 0)` / `oklch(0.141 0.005 285.823)` | reversed to zinc-950 / zinc-50 | Reuse local tokens exactly. |
| `muted` / `muted-foreground` | zinc-100 / zinc-500 | zinc-800 / zinc-400 | Reuse local tokens exactly. |
| `border` | zinc-200 | zinc-800 upstream | Keep local dark translucent `white / 10%`; it is an intentional shell-wide Nova deviation. |
| `line` | `color-mix(in oklab, border 64%, background)` | same formula | Reuse local `--line`; it already matches. |
| `surface` | zinc-50 | zinc-900 | Add only as a Blog-local alias if needed; local `muted`/`card` can express the same hierarchy without a global token. |
| `code` | background | background | Reuse the current background and foreground rather than adding global code colors. |
| selection | zinc-950 on zinc-50 | zinc-50 on zinc-950 | Reuse local selection tokens exactly. |

The upstream values and the `screen-line-*` utilities are defined in its pinned [`globals.css`](https://github.com/ncdai/chanhdai.com/blob/83e0b842ba67b185f59f0977bc854726a32b32c3/src/styles/globals.css). This repository already defines the matching core palette, `--line`, selection colors, and screen-line utilities. [Local global tokens](../../src/app/globals.css).

Do not copy upstream’s full global style file. It also contains chart, analytics-site, scrollbar, Tailwind Typography, and reference-shell policy that is unrelated to Blog. Blog-specific aliases and selectors belong with Blog presentation; application-wide tokens stay in the app stylesheet, consistent with ADR 0002.

### Typography and measure

| Element | Live/source contract |
| --- | --- |
| Catalog/Article display title | Geist, 36 px / 40 px, weight 500, `-0.9px` tracking, balanced wrapping |
| Catalog tagline | Geist, 14 px / 14 px, weight 500, `0.7px` tracking, muted |
| Catalog card title | Geist, 18 px / 24.75 px, weight 500, balanced |
| Catalog date | Geist, 14 px / 20 px, regular, muted |
| Article body | Geist, 16 px / 28 px |
| Article `h2` | 20 px / 28 px, weight 500, `-0.5px` tracking |
| Article `h3` | 18 px / 28 px, weight 500, `-0.45px` tracking |
| Code tokens | Geist Mono, 14 px / 20 px |

The values are both live-observed and source-traced through the catalog title/card classes and the upstream prose utility. [Catalog heading source](https://github.com/ncdai/chanhdai.com/blob/83e0b842ba67b185f59f0977bc854726a32b32c3/src/components/page-heading.tsx); [catalog card source](https://github.com/ncdai/chanhdai.com/blob/83e0b842ba67b185f59f0977bc854726a32b32c3/src/features/blog/components/post-item.tsx); [upstream prose styles](https://github.com/ncdai/chanhdai.com/blob/83e0b842ba67b185f59f0977bc854726a32b32c3/src/styles/globals.css).

This repository already loads Geist Sans and Geist Mono and has a comprehensive shadcn/typeset-derived stylesheet. Keep those foundations. Create a Blog Article typeset preset by overriding its variables to 16 px, `1.75` leading, and the measurements above; do not add `@tailwindcss/typography` merely to reproduce upstream’s `prose` classes. [Local font setup](../../src/app/layout.tsx); [local typeset foundation](../../src/app/typeset.css).

## Catalog specification

The catalog stays inside the existing 48 rem/768 px lined application rail. At desktop the observed inner list is 766 px wide with two 375 px columns and a 16 px gap. Each card uses 8 px outer padding, an 8 px vertical gap, and another 8 px content inset. The Cover image is 1200:630, 12 px rounded, and has a one-pixel adaptive inset ring (`black / 15%` light, `white / 15%` dark). It is grayscale at rest and transitions to color over 300 ms on pointer hover. The card background transitions to the muted accent. [Live Blog](https://chanhdai.com/blog); [catalog list source](https://github.com/ncdai/chanhdai.com/blob/83e0b842ba67b185f59f0977bc854726a32b32c3/src/features/blog/components/post-list.tsx); [card source](https://github.com/ncdai/chanhdai.com/blob/83e0b842ba67b185f59f0977bc854726a32b32c3/src/features/blog/components/post-item.tsx).

At 390 px, the local-style shell leaves a 361 px rail. The list becomes one column, each Cover is 345×181.125 px after card padding, and every item receives full-width top and bottom guide lines. At `sm` the two-column grid and alternating row guide-line pattern begin. Preserve the repository’s existing header, footer, mobile bottom navigation, and 768 px shell rather than importing the reference shell. [Local app shell](../../src/app/_shell/app-shell.tsx); [local header](../../src/app/_shell/header/header.tsx).

Catalog content must come from `ArticleSummary`, not registry sample data. Show:

- required Cover, title, `publishedAt`, and Tags;
- a Draft indicator only in the local-development Draft surface;
- `updatedAt` only when product copy can distinguish it clearly from publication;
- `dd.MM.yyyy`, matching the reference’s compact date treatment, while the semantic `dateTime` remains the canonical ISO value.

The reference has no visible Tags. This repository does, and Tags are a controlled Blog concept exposed on every Article summary, so this is an intentional deviation. Use the installed `Badge` as the visual base and a Blog-owned Tag facet/link composition for selection and counts; do not create a new global Tag primitive or copy upstream’s unregistered `Tag`. [Domain language](../../CONTEXT.md); [Article projections](../../src/features/blog/articles/types.ts); [installed Badge](../../src/shared/ui/badge.tsx); [upstream Tag source](https://github.com/ncdai/chanhdai.com/blob/83e0b842ba67b185f59f0977bc854726a32b32c3/src/components/ui/tag.tsx).

### Search states and interaction

The reference search is a 36 px-high `InputGroup` inside an 8 px-padded, full-width lined strip. It has an inline search icon, `Search blog…` placeholder, and a 24 px clear control that appears only for a non-empty query. The query is URL-backed as `?q=`, filtering is case-insensitive after removing spaces, Escape clears it, and analytics waits 500 ms for a query of at least two characters. The list falls back to `No posts found.` [Search component](https://github.com/ncdai/chanhdai.com/blob/83e0b842ba67b185f59f0977bc854726a32b32c3/src/features/blog/components/post-search-input.tsx); [query hook](https://github.com/ncdai/chanhdai.com/blob/83e0b842ba67b185f59f0977bc854726a32b32c3/src/features/blog/hooks/use-search-query.ts); [filter hook](https://github.com/ncdai/chanhdai.com/blob/83e0b842ba67b185f59f0977bc854726a32b32c3/src/features/blog/hooks/use-filtered-posts.ts).

Inherit the dimensions and clear/Escape states, but not the algorithm or `nuqs` dependency. This repository already owns a lazy Fuse service, weighted title/Tag/description/heading/body search, highlight ranges, snippets, a score cutoff, and its `/blog/search.json` contract. The Blog search UI should display that result contract, including highlighted title/Tag/snippet, explicit idle/loading/no-results/error states, and Draft markers in development. Reuse installed `InputGroup`, `Button`, and `Spinner`. [Local search service](../../src/features/blog/search/service.ts); [search artifact contract](../../src/features/blog/search/contract.ts); [InputGroup](../../src/shared/ui/input-group.tsx); [Spinner](../../src/shared/ui/spinner.tsx).

## Article specification

### Chrome and responsive layout

The Article header is a 768 px lined rail. Its 44 px action row contains a back-to-Blog link on the left and 28 px controls on the right; the title remains 36/40 px with 16 px inline padding. The desktop body is a viewport-wide three-column grid `1fr / 768px / 1fr`: content remains aligned to the shell rail while the TOC occupies the free right column. The prose has 32 px top and 16 px inline padding, yielding 734 px readable width. At 390 px the content rail is 363 px, the prose is 361 px with 329 px readable width, and a long title naturally grows in 40 px line increments. [Article page source](https://github.com/ncdai/chanhdai.com/blob/83e0b842ba67b185f59f0977bc854726a32b32c3/src/app/%28app%29/%28docs%29/blog/%5Bslug%5D/page.tsx); [Article grid source](https://github.com/ncdai/chanhdai.com/blob/83e0b842ba67b185f59f0977bc854726a32b32c3/src/features/doc/components/doc-layout.tsx).

Keep the local shell’s rail and boundaries. A desktop TOC may be positioned outside that rail when space exists, but Blog must not replace the app header/footer or make `src/shared` depend on Blog. The route remains a thin adapter and `ArticleView` owns Article presentation. [Feature-first architecture ADR](../adr/0002-adopt-a-feature-first-application-architecture.md); [current Article view](../../src/features/blog/articles/view.tsx).

The reference chrome offers Back, Copy page/view options, Share, and previous/next navigation. Adopt Back, Share, and previous/next. Omit Copy page, “view as Markdown,” and AI-provider actions until this repository has an intentional raw-Article route contract; the reference implements those by fetching a `.mdx` URL that does not exist here. Add the repository’s publication date, optional update date, Tags, and Draft status below the title because those are established local contracts. Do not automatically repeat the Cover in the Article body; the reference does not, and authored figures already cover intentional inline media. [Reference Article actions](https://github.com/ncdai/chanhdai.com/blob/83e0b842ba67b185f59f0977bc854726a32b32c3/src/features/doc/components/doc-page-actions.tsx); [reference Share behavior](https://github.com/ncdai/chanhdai.com/blob/83e0b842ba67b185f59f0977bc854726a32b32c3/src/features/doc/components/doc-share-menu.tsx); [local Article components](../../src/features/blog/rendering/components.tsx).

Build Share as a Blog-owned composition. Reuse local `Button` and `CopyButton`; later adopt the generic `@shadcn/dropdown-menu` only if it is still missing. Adapt the `@ncdai/share-menu` behavior—copy link, X, LinkedIn, and conditional native share—but do not add `sonner` solely for this action; the existing copy component already exposes an accessible live result. [Local CopyButton](../../src/shared/ui/copy-button.tsx); [`@ncdai/share-menu`](https://chanhdai.com/r/share-menu.json).

### Table of contents

At `lg` the reference hides the inline TOC and shows a sticky 72 px minimap in the right gutter. Every heading is a 24×2 px line; depth 3 becomes 16 px with 8 px indent, depth 4 becomes 8 px with 16 px indent. Active lines use foreground; inactive lines use `ring / 50%`; color changes take 200 ms. Hover opens a 224 px-wide, scroll-bounded title list to the left. The source uses `IntersectionObserver`, tracks the most recently visible heading, smooth-scrolls on selection, updates the URL hash, and plays an opening sound. [Current TOC minimap source](https://github.com/ncdai/chanhdai.com/blob/83e0b842ba67b185f59f0977bc854726a32b32c3/src/components/toc-minimap.tsx); [`@ncdai/toc-minimap` registry item](https://chanhdai.com/r/toc-minimap.json).

Below `lg`, use a local `Collapsible` “On this page” card. Live at 390 px it is 329×40 px collapsed; the 12-heading representative list expands it to 384 px total. The list uses 14/20 px text, 16 px horizontal padding, 8 px bottom padding, and 16/32 px indentation for depths 3/4. [Inline TOC source](https://github.com/ncdai/chanhdai.com/blob/83e0b842ba67b185f59f0977bc854726a32b32c3/src/components/toc-inline.tsx).

Do not install the TOC registry item as-is. Its published version carries its own observer and pulls `hover-card` plus `@soundcn/u-mini-map-open`; the current live source instead depends on Fumadocs TOC types/state and a Base UI hover card. This repository needs neither Fumadocs nor Base UI. Adapt the small visual/observer behavior into Blog, take heading IDs from the existing compiled Article contract, reuse the shared audio mechanism only if sound remains desired, and later adopt `@shadcn/hover-card` as the product-neutral popup primitive. Respect reduced motion by avoiding forced smooth scroll when the visitor requests reduced motion; make the full TOC available by focus/click, not hover alone.

### Prose, headings, and code

Use the local `.typeset` foundation for paragraphs, lists, GFM task lists, links, tables, blockquotes, details, inline code, figures, captions, media, and print. Add Blog-owned selectors for the reference’s tighter 20 px `h2`, 18 px `h3`, balanced headings, subtle link underline, and 12 px framed media/code surfaces. The upstream `@ncdai/typography` registry entry requires `@tailwindcss/typography`, while this repository already carries a fuller zero-dependency typeset stylesheet; installing it would create two prose systems. [Local typeset](../../src/app/typeset.css); [`@ncdai/typography`](https://chanhdai.com/r/typography.json).

Code blocks should inherit the reference container, not its compiler:

- 12 px outer radius, surface background, `border / 64%` inset ring, 4 px padding;
- horizontally scrollable `pre`, 16 px vertical padding, 14/20 px Geist Mono tokens;
- optional title row at 14 px mono;
- line-number, highlighted-line, and highlighted-character layers;
- a 28 px copy control at the top-right, with the full control always reachable by keyboard and visible on coarse pointers;
- long code remains horizontally scrollable at mobile width rather than wrapping.

The upstream compiler uses `github-light-default` and `vesper`. Keep this repository’s already selected `github-light`/`github-dark` pair as an intentional deviation: it is fine-grained, locally bundled, covered by the current compiler contract, and avoids changing token colors merely for mimicry. Preserve existing diff/focus/highlight/word-highlight notation, Twoslash, code titles, line-number starts, raw copy source, and synchronized Code Tabs. [Upstream highlighter](https://github.com/ncdai/chanhdai.com/blob/83e0b842ba67b185f59f0977bc854726a32b32c3/src/lib/rehype-code-block.ts); [local theme selection](../../next.config.ts); [local code compiler](../../src/features/blog/rendering/code.ts); [local Code Tabs](../../src/features/blog/rendering/code-tabs.tsx).

## Reuse, adapt, adopt, or own

| Need | Disposition | Foundation and boundary |
| --- | --- | --- |
| Catalog heading and lined layout | **Adapt** | Reuse local shell lines and Panel vocabulary; Blog owns catalog composition. Use upstream page/card measurements, not the registry block. |
| Article cards | **Own in Blog** | Render `ArticleSummary` and required Cover through `next/image`; reuse local tokens and Button/Badge where needed. |
| Inline search | **Reuse + own** | Reuse `InputGroup`, Button, Spinner; Blog owns query state and adapts the existing Fuse result service. |
| Tags/facets | **Reuse + own** | Reuse `Badge`; Blog owns controlled Tag semantics, counts, selected state, and routing. |
| Article chrome | **Reuse + own** | Reuse Button, Tooltip, Kbd, CopyButton; Blog owns back/share/neighbour/meta policy. |
| Share popup | **Adapt; later adopt primitive** | Adapt `@ncdai/share-menu`; adopt `@shadcn/dropdown-menu` only as generic UI. |
| Desktop TOC | **Adapt; Blog-owned** | Adapt `@ncdai/toc-minimap`; derive items from compiled headings; optionally adopt `@shadcn/hover-card`. |
| Mobile TOC | **Reuse + own** | Reuse local Collapsible and Blog heading data; no new package. |
| Prose | **Reuse + extend** | Reuse local typeset stylesheet; Blog owns its preset/selectors. Reject `@ncdai/typography`. |
| Tables | **Adapt now; possible registry adoption** | Keep semantic Article wrappers; adopt `@shadcn/table` only if a generic overflow wrapper is required. |
| Code block/copy | **Reuse + style** | Keep local compiler, `ArticleCodeBlock`, and CopyButton. Reject `@ncdai/code-block-command` and duplicate copy stack. |
| Code Tabs | **Reuse** | Keep the tested Blog-owned synchronized implementation. |
| Accordion/Tabs | **Reuse** | Keep current Blog-owned Radix compositions and hash-reveal behavior; no shadcn install is justified. |
| Callout/Card/File tree/Steps/Kbd/Figure | **Reuse + style** | Existing approved MDX components already compose Alert, Card, Collapsible, Kbd, `next/image`, and semantic HTML. |

The installed shared inventory relevant to this work is Alert, Badge, Button, Card, Collapsible, Command, CopyButton, Dialog, Input, InputGroup, Kbd, Panel, Separator, Spinner, Textarea, and Tooltip. These are deliberately product-neutral foundations; catalog cards, Tag filters, search results, Article chrome, TOCs, and MDX policy remain Blog-owned under ADR 0002. [Shared UI directory](../../src/shared/ui); [approved MDX map](../../src/features/blog/rendering/mdx-components.ts).

## Dependency and provenance ledger

| Candidate/source | Dependency impact | License/provenance | Decision |
| --- | --- | --- | --- |
| Pinned Chánh Đại source and `@ncdai` registry | Reference source uses Base UI, Fumadocs, `nuqs`, `react-hotkeys-hook`, Sonner, Tailwind Typography, and other site dependencies. | Repository is MIT, copyright Chánh Đại; retain notice for any substantial copied portion. [Pinned license](https://github.com/ncdai/chanhdai.com/blob/83e0b842ba67b185f59f0977bc854726a32b32c3/LICENSE). | Attribute adapted TOC/share/card behavior; do not import the reference application dependency graph. |
| `@ncdai/blog-02` | `date-fns`, Button, and registry `style`; `date-fns` and Button already exist locally. | Registry item names Chánh Đại as author and is sourced from the MIT repository. [`blog-02`](https://chanhdai.com/r/blog-02.json). | Visual/source reference only. |
| `@ncdai/toc-minimap` | Hover Card plus `@soundcn/u-mini-map-open`. | Registry item names Chánh Đại as author; implementation is in the MIT repository. [`toc-minimap`](https://chanhdai.com/r/toc-minimap.json). | Adapt behavior; use local boundaries/audio. |
| `@ncdai/share-menu` | Button, Dropdown Menu, Sonner. | Registry item names Chánh Đại as author; implementation is in the MIT repository. [`share-menu`](https://chanhdai.com/r/share-menu.json). | Adapt behavior; do not add Sonner only for feedback. |
| `@ncdai/copy-button` | Motion, Tiks, Web Haptics, Button, Icon Swap. | Registry item names Chánh Đại as author. [`copy-button`](https://chanhdai.com/r/copy-button.json). | Reject; local accessible CopyButton exists. |
| `@ncdai/code-block-command` | Base UI, Motion, Jotai, Copy Button, Icon Swap. | Registry item names Chánh Đại as author. [`code-block-command`](https://chanhdai.com/r/code-block-command.json). | Reject; duplicates existing code contracts and adds state dependencies. |
| shadcn registry UI | Source components from the official shadcn registry; the upstream `shadcn-ui/ui` repository is MIT. [Official repository](https://github.com/shadcn-ui/ui); [license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md). | Normally only the selected primitive and its existing Radix aggregate dependency. | Consider Dropdown Menu, Hover Card, and Table in the implementation ticket; install nothing now. |

Because this is an MIT-to-MIT adaptation, copying a substantial upstream implementation requires preserving its copyright and permission notice. Prefer reimplementing the small behavior against the measurements and local contracts, and add a focused source comment where code is materially derived.

## Acceptance checklist for the later specification/implementation

- Catalog and Article are verified at 390 px, the `sm` transition, 768 px, and a desktop width with a right TOC gutter, in both themes.
- Pointer, keyboard, coarse-pointer, and reduced-motion states are explicit; no copy or heading-link control is hover-only.
- Search covers idle, lazy-loading, populated, no-results, load-error, clear, Escape, highlight, snippet, Tag, and local Draft states.
- Cover aspect ratio, adaptive inset ring, card focus treatment, and image hover behavior do not hide information or become required interaction.
- Article chrome keeps the local shell and exposes only routes/contracts that exist.
- Desktop and mobile TOCs use the same deterministic heading projection, update hashes safely, and reveal headings inside existing Tabs/Accordions.
- Typeset fixtures cover every approved MDX component, narrow tables, long links, long unbroken code, light/dark Shiki output, copy success/error, and print.
- Registry additions are reviewed with `shadcn view`/diff before installation; no registry style may overwrite the application token set.
- Any materially copied upstream code retains MIT provenance.

## Source coverage

Primary sources inspected were the current live Blog catalog and representative Article; the pinned upstream catalog page/components/hooks; Article route, grid, chrome, TOC, prose, MDX, and highlighting source; the published `@ncdai` registry index/items; the official `@shadcn` registry results and source repository; and this repository’s shell, UI primitives, Article projections, Fuse search, MDX components, code compiler, styles, package manifest, domain language, and feature-first ADR. No secondary article, component roundup, screenshot-only inference, component installation, dependency installation, or application-source edit was used.
