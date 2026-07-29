# Choose the remaining Blog transform and media-validation dependencies

Research for [Choose the remaining Blog transform and media-validation dependencies](https://github.com/levinbaenninger/website/issues/16), captured on 2026-07-28.

## Decision

Complete the resolved Article language with focused unified utilities, a fine-grained Shiki/Twoslash stack, and Blog-owned validation plugins. Validate Article-owned media in the build-only source-manifest generator with the Sharp version already selected by Next.js and a maintained XML DOM parser.

Add these exact direct production dependencies:

| Package | Version | Direct responsibility |
| --- | --- | --- |
| `remark-gfm` | `4.0.1` | Enable the resolved GFM tables, strikethrough, task lists, and literal autolinks in MDX's existing MDAST parse. |
| `unist-util-visit` | `5.1.0` | Walk the MDAST for Article-language validation and search extraction. Direct child checks owned by the Blog handle closed component structures; no second traversal package is needed. |
| `mdast-util-to-string` | `4.0.0` | Derive plain heading text and the explicitly searchable visitor-visible labels from already-validated MDAST nodes. |
| `github-slugger` | `2.0.0` | Generate the one canonical GitHub-style heading-ID sequence used by rendering, search headings, and link validation. |
| `@shikijs/rehype` | `4.3.1` | Highlight fenced code in HAST through its fine-grained `/core` entrypoint. |
| `@shikijs/transformers` | `4.3.1` | Implement the resolved diff, line/word highlight, and focus annotations. |
| `@shikijs/twoslash` | `4.3.1` | Turn build-time Twoslash results into the approved rich HAST UI contract. |
| `shiki` | `4.3.1` | Construct the fine-grained highlighter, engine, and bundled Wasm used directly by the Blog wrapper. |
| `@shikijs/langs` | `4.3.1` | Import only the grammars behind the resolved Article language identifiers. |
| `@shikijs/themes` | `4.3.1` | Import only the selected light and dark code themes. |
| `twoslash` | `0.3.9` | Construct a custom isolated Twoslash runner rather than the default current-working-directory-backed runner. |
| `@typescript/vfs` | `1.6.4` | Seed the isolated runner with TypeScript's pinned library files and an explicit allowlist of installed package declarations. |

These are production dependencies in this repository's established sense: Next.js loads them while compiling MDX during a production build. Their output is static React/HAST; the packages do not belong in the visitor's browser bundle. `shiki`, its language/theme packages, `twoslash`, and the TypeScript VFS are direct because Blog code imports their public entrypoints. pnpm must not make those imports depend on incidental transitive visibility. Keep every Shiki package on exactly `4.3.1`.

Add these exact direct development dependencies:

| Package | Version | Direct responsibility |
| --- | --- | --- |
| `sharp` | `0.34.5` | Inspect metadata and force a bounded decode of supported raster assets in the development/build-only generator. This exact version reuses Next.js 16.2.12's existing locked Sharp and platform-binary tree. |
| `@xmldom/xmldom` | `0.9.10` | Parse bounded SVG source into a namespace-aware, location-bearing DOM for fail-closed Blog policy validation. |
| `@types/mdast` | `4.0.4` | Type the Blog-owned MDAST plugin without relying on transitive declarations. |
| `@types/hast` | `3.0.5` | Type the Blog-owned highlighted HAST boundary without relying on transitive declarations. |

Keep the existing exact `typescript@6.0.3` development dependency and pass that module explicitly to the Twoslash runner. Do not install another compiler version.

The versions were verified from their first-party registry metadata and source: [`remark-gfm`](https://registry.npmjs.org/remark-gfm/4.0.1), [`unist-util-visit`](https://registry.npmjs.org/unist-util-visit/5.1.0), [`mdast-util-to-string`](https://registry.npmjs.org/mdast-util-to-string/4.0.0), [`github-slugger`](https://registry.npmjs.org/github-slugger/2.0.0), [Shiki rehype](https://registry.npmjs.org/%40shikijs%2Frehype/4.3.1), [Shiki transformers](https://registry.npmjs.org/%40shikijs%2Ftransformers/4.3.1), [Shiki Twoslash](https://registry.npmjs.org/%40shikijs%2Ftwoslash/4.3.1), [Shiki](https://registry.npmjs.org/shiki/4.3.1), [Shiki languages](https://registry.npmjs.org/%40shikijs%2Flangs/4.3.1), [Shiki themes](https://registry.npmjs.org/%40shikijs%2Fthemes/4.3.1), [Twoslash](https://registry.npmjs.org/twoslash/0.3.9), [TypeScript VFS](https://registry.npmjs.org/%40typescript%2Fvfs/1.6.4), [Sharp](https://registry.npmjs.org/sharp/0.34.5), and [xmldom](https://registry.npmjs.org/%40xmldom%2Fxmldom/0.9.10).

## Transform order and ownership

Configure the JavaScript MDX compiler selected in the [original stack decision](choose-mdx-content-processing-stack.md) in this exact order:

1. `remark-frontmatter`
2. `remark-mdx-frontmatter`
3. `remark-gfm`
4. one Blog-owned Article MDAST contract plugin
5. MDX's existing MDAST-to-HAST bridge
6. one Blog-owned rehype/Shiki code plugin
7. MDX's existing React compilation

The Article MDAST plugin is the single source of truth for the closed authoring language. It:

- validates imports, exports, expressions, raw HTML, elements, props, nesting, links, headings, code fences, file trees, local media usage, and the explicitly deferred syntax;
- preserves the pristine code value and derives copy text before rendering transforms;
- groups consecutive tabbed fences and annotates the internal `CodeBlock`/`CodeTabs` contract without prematurely replacing the code nodes Shiki needs;
- gives one fresh `GithubSlugger` instance the plain text of each valid `h2`–`h6`, assigns the resulting ID through MDAST `data.hProperties`, and exports the same ordered heading facts for search and fragment validation; and
- creates the search export from the already-validated tree, including only the prose and named visitor-visible labels resolved in issue #10.

`unist-util-visit` supplies the normal walk and immediate parent. Direct child loops validate the closed `Cards`, `Tabs`, `Files`, `Steps`, and similar structures. This avoids adding `unist-util-visit-parents`; add it only if implementation demonstrates a real full-ancestor-stack requirement.

The Blog rehype/Shiki plugin owns one memoized highlighter and the complete code-output seam. It uses `@shikijs/rehype/core` with direct, fine-grained imports rather than Shiki's full bundle. Map the authored identifiers to canonical grammars:

| Authored identifier | Loaded grammar                 |
| ------------------- | ------------------------------ |
| missing or `text`   | no grammar; escaped plain text |
| `bash`              | `shellscript`                  |
| `css`               | `css`                          |
| `html`              | `html`                         |
| `js`                | `javascript`                   |
| `jsx`               | `jsx`                          |
| `json`              | `json`                         |
| `md`                | `markdown`                     |
| `mdx`               | `mdx`                          |
| `ts`                | `typescript`                   |
| `tsx`               | `tsx`                          |
| `yaml`              | `yaml`                         |
| `diff`              | `diff`                         |

Load exactly the selected light/dark theme pair and Shiki's local Oniguruma Wasm engine. The official fine-grained API imports individual languages and themes and does not fetch them at build time. Shiki 4.3.1 requires Node 20 or newer, so Node 24.18.0 is within its supported range. [Shiki fine-grained rehype integration](https://shiki.style/packages/rehype#fine-grained-bundle); [Shiki bundle guidance](https://shiki.style/guide/bundles#fine-grained-bundle); [Shiki regex engines](https://shiki.style/guide/regex-engines).

Inside that plugin, use this rendering-transform order:

1. `transformerNotationDiff({ matchAlgorithm: "v3" })`
2. `transformerNotationHighlight({ matchAlgorithm: "v3" })`
3. `transformerNotationWordHighlight({ matchAlgorithm: "v3" })`
4. `transformerNotationFocus({ matchAlgorithm: "v3" })`
5. the custom isolated Twoslash transformer

The Blog validates all annotations before this stage. Running Twoslash last makes its source positions reflect the preceding notation removals. It is enabled only for a validated explicit `twoslash` flag on `ts` and `tsx`, and `throws` remains enabled. A mixed-annotation fixture must lock this ordering. Shiki's transformer package deliberately supplies classes rather than UI styles, leaving presentation with the Blog. [Shiki common transformers](https://shiki.style/packages/transformers); [Shiki Twoslash explicit trigger and renderer](https://shiki.style/packages/twoslash#explicit-trigger).

Line numbers, positive start values, titles, tabs, copy text, and the final React node shape remain Blog-owned policy; do not add packages for them. The component registry maps the plugin's internal nodes to Server Components and the already-resolved small client islands.

## Turbopack serialization

The installed Next.js 16.2 guide requires plugin names plus JSON-serializable options because JavaScript functions cannot cross Turbopack's Rust configuration boundary. The matching `@next/mdx` loader resolves each string with `require.resolve` from the project root and dynamically imports it before calling the MDX loader. Therefore Next config contains only:

```js
remarkPlugins: [
  "remark-frontmatter",
  "remark-mdx-frontmatter",
  "remark-gfm",
  resolvedArticleContractPluginPath,
],
rehypePlugins: [resolvedArticleCodePluginPath],
```

Both local paths are absolute strings resolved while evaluating Next config. The local modules construct every visitor function, highlighter, transformer, and Twoslash runner internally. No function or class instance appears in `next.config`. [Installed Next.js guide](../../node_modules/next/dist/docs/01-app/02-guides/mdx.md#using-plugins-with-turbopack); [matching `@next/mdx` loader source](https://github.com/vercel/next.js/blob/v16.2.12/packages/next-mdx/mdx-js-loader.js).

## GFM is syntax, not permission

`remark-gfm` is the maintained focused syntax plugin for tables, strikethrough, task lists, and literal autolinks. It works on unified 11—the same generation used by MDX 3—and does not introduce another parser. [remark-gfm source and supported syntax](https://github.com/remarkjs/remark-gfm).

Its parse surface is broader than the Article contract. In the verified MDX 3 compile, footnote nodes were recognized and bare `www.example.com` and `name@example.com` became HTTP and `mailto:` links. The Article plugin must therefore report fatal diagnostics for:

- footnote definitions and references, because footnotes are explicitly deferred;
- generated or authored `http:` and `mailto:` links; and
- every other link form outside same-Article fragments, root-relative paths, and absolute HTTPS.

Do not disable GFM output after parsing or silently remove it: issue #10 requires unsupported source to fail.

## Heading IDs

Use `github-slugger` directly during the MDAST contract pass. It accepts plain heading text and maintains duplicate state (`cache`, `cache-1`, `cache-2`) exactly at the point where the Blog also extracts headings and validates fragments. [github-slugger behavior](https://github.com/Flet/github-slugger).

Do not add `rehype-slug`. It would compute IDs later from a second tree, while the Blog would still need MDAST heading facts for search and link validation. Two slugger instances would create an avoidable disagreement seam.

## Offline, isolated Twoslash

The default `@shikijs/twoslash` helper constructs Twoslash against the process's real current working directory. That is too broad for the resolved isolated-project contract. Instead:

1. use `@typescript/vfs` to create an in-memory map containing the exact TypeScript 6.0.3 library declarations;
2. add only reviewed declaration files for explicitly installed and pinned packages from a Blog-owned allowlist;
3. construct `createTwoslasher` from `twoslash/core` with that `fsMap`, a synthetic root, and the explicitly imported TypeScript 6.0.3 module;
4. pass the runner to `createTransformerFactory` from `@shikijs/twoslash/core`;
5. pre-reject relative imports and bare imports absent from the allowlist; and
6. reject author-controlled compiler flags, type acquisition, CDN helpers, fetches, and persistent external caches.

`twoslash@0.3.9` declares support for TypeScript `^6.0.0`, and its current core explicitly uses `pathsBasePath` for TypeScript 6. Unexpected diagnostics remain errors; intentional examples use only the approved expected-error directives. [`twoslash` source](https://github.com/twoslashes/twoslash); [Shiki Twoslash custom transformer source](https://github.com/shikijs/shiki/tree/v4.3.1/packages/twoslash).

This toolchain has no build-time network path: grammars, themes, Wasm, compiler libraries, and package declarations come from exact locked packages. The repository's existing GitHub-contributions fetch means the whole site build is not currently globally offline; this decision guarantees that Article compilation itself introduces no network dependency. Verify that boundary with network-disabled Article fixtures.

## Raster validation

Keep raster policy in the Blog's development/build-only source-manifest generator. `sharp@0.34.5` is intentionally selected instead of the current `0.35.3`: Next.js 16.2.12 already locks `0.34.5`, so a direct exact pin exposes the API under pnpm while reusing one native/libvips platform tree. Its engine range accepts Node 24.

For each `.avif`, `.webp`, `.png`, `.jpg`, or `.jpeg`:

1. `stat` before reading and fail above 10 MiB;
2. check the magic bytes and require the decoded format to agree with the lowercase extension (`jpg` and `jpeg` share JPEG);
3. for PNG, scan the bounded chunk stream and reject an `acTL` chunk before `IDAT`; the PNG specification defines that as the APNG animation declaration;
4. call Sharp with `failOn: "warning"`, `limitInputPixels: 40_000_000`, and `unlimited: false`;
5. require positive width/height, at most 8,192 on either axis, at most 40 megapixels, and a single page/frame with no animation timing/loop metadata; then
6. force a bounded pixel decode with `stats()` or raw output and discard it.

Sharp documents `metadata()` as header-only, so it cannot by itself satisfy “decode successfully.” It exposes page/frame metadata for multi-page WebP and HEIF/AVIF, while the explicit PNG `acTL` scan closes the APNG gap. Do not transform or rewrite accepted files. [Sharp metadata](https://sharp.pixelplumbing.com/api-input/#metadata); [Sharp constructor limits and failure mode](https://sharp.pixelplumbing.com/api-constructor/); [W3C PNG animation-control chunk](https://www.w3.org/TR/png-3/#11animation-info).

## SVG validation

Use `@xmldom/xmldom@0.9.10`, not `saxes@6.0.0`. xmldom is active, dependency-free, accepts Node 24, produces a namespace-aware DOM with line/column data, and its 0.9 parser fails on malformed XML. Version 0.9.10 also contains the current security fixes. Saxes is archived and its last stable release is no longer the smallest-maintained choice. [xmldom source and API](https://github.com/xmldom/xmldom); [xmldom 0.9.10 release](https://github.com/xmldom/xmldom/releases/tag/0.9.10).

Validation is reject-only, never sanitization:

1. `stat` and reject above 1 MiB before reading;
2. pre-reject DTD/entity declarations, then parse as `image/svg+xml` with warnings/errors configured to stop parsing;
3. require exactly one `svg` root in the SVG namespace and reject document types, processing instructions other than the XML declaration, and entity nodes;
4. traverse iteratively with explicit node/depth ceilings;
5. require a valid four-number `viewBox` and finite positive numeric `width` and `height`;
6. allow only the reviewed static SVG element/attribute vocabulary;
7. reject scripts, `foreignObject`, embedded HTML/images, animation, interactive/link elements, `on*` handlers, external resources, fonts, and every nonlocal URL;
8. allow `href="#id"` and paint/filter `url(#id)` only, while requiring unique IDs and resolved local references; and
9. render accepted SVG imports with Next Image's `unoptimized` behavior.

To avoid adding a CSS parser to the initial stack, reject `style` elements and `style` attributes; presentation attributes cover the approved static shapes, gradients, masks, filters, symbols, and text. Revisit internal CSS only for a concrete Article asset with a separately specified CSS safety grammar. SVG itself supports scripting, declarative animation, and external resources, which is why a successful XML parse is only the start of validation. [SVG scripting](https://www.w3.org/TR/SVG/interact.html); [SVG external-resource elements](https://www.w3.org/TR/SVG/struct.html).

## Rejected dependencies

| Package or approach | Why it is not selected |
| --- | --- |
| `rehype-slug` | Duplicates the MDAST-owned heading and fragment truth. |
| `rehype-pretty-code`, Prism, or Highlight.js | Duplicates the resolved direct official Shiki wrapper and its Blog-owned metadata/UI contract. |
| Fumadocs code/content packages | Adds a content framework and component policy the resolved stack explicitly rejected. |
| `image-size` | Header inspection does not prove complete decoding or cover the animation policy. |
| Sharp `0.35.3` | Creates a second native/libvips tree beside the version already locked by Next.js. |
| `saxes` | Its repository is archived; maintained xmldom is a better fit for policy inspection and diagnostics. |
| SVGO | Optimizes and rewrites source; the contract requires fatal validation and byte preservation. |
| DOMPurify, `rehype-sanitize`, or an SVG sanitizer | Repair/drop semantics conflict with fatal diagnostics, and a generic HTML schema does not express the closed MDX/SVG language. |
| `fast-xml-parser` | Broader builder/conversion surface and more dependencies than the needed maintained DOM parser. |
| `unist-util-visit-parents` | The selected normal walk plus explicit closed-structure checks is sufficient initially. |
| direct `remark`, `rehype`, `unified`, or `@mdx-js/mdx` | `@next/mdx` already owns parsing, processing, and compilation. |
| `@typescript/twoslash` | Superseded by `twoslash`; Shiki 4.3.1 integrates the successor. |

## Compatibility and verification

A clean scratch compile using Node 24.18.0, MDX 3.1.1, TypeScript 6.0.3, `remark-gfm@4.0.1`, the complete fine-grained Shiki 4.3.1 highlighter, its local Oniguruma engine, all resolved code transformers, and Twoslash completed successfully. Package metadata also establishes:

- Shiki 4.3.1 requires Node 20 or newer;
- `@shikijs/twoslash` accepts TypeScript 5.5 or newer;
- `twoslash@0.3.9` explicitly accepts TypeScript 6;
- Sharp 0.34.5 accepts Node 24; and
- xmldom 0.9.10 accepts Node 14.6 or newer.

Implementation must add fixtures that cover every allowed and rejected Markdown construct, duplicate/non-ASCII headings, fragment links, mixed code annotations, copy output, expected and unexpected Twoslash diagnostics, disallowed imports, corrupt/truncated rasters, every animation format, dimension/byte ceilings, malformed XML, every forbidden SVG capability, unresolved SVG fragments, and deep trees. Run Article fixture compilation twice under blocked network and compare generated manifest/search bytes. Run both Turbopack development compilation and `vp run build`; package-level compatibility does not replace the exact Next.js integration check.

This decision adds dependencies and ownership seams only. It does not implement the Blog, transforms, generator, validators, registry, or visual code presentation.
