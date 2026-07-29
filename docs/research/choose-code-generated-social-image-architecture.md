# Choose the code-generated social-image architecture

Research for [Choose the code-generated social-image architecture](https://github.com/levinbaenninger/website/issues/15), captured on 2026-07-28 and amended on 2026-07-29 after production-build verification.

## Decision

Use Next.js **`next/og` `ImageResponse`**. Portfolio and Blog use colocated `opengraph-image.tsx` and `twitter-image.tsx` metadata files. Articles use statically generated `open-graph.png` and `twitter-card.png` Route Handlers referenced explicitly from page metadata. Generate every visible Article image during `next build`; do not introduce a query-driven endpoint or request-time rendering.

`next/og` is part of the pinned stable `next@16.2.12`, emits PNG, and is sufficient for a bounded 1200×630 social card. The installed implementation bundles Satori, Yoga Wasm, and Resvg Wasm; selecting it adds no direct dependency or native deployment binary. [Installed `@vercel/og` package metadata](../../node_modules/next/dist/compiled/@vercel/og/package.json); [installed `ImageResponse` documentation](../../node_modules/next/dist/docs/01-app/03-api-reference/04-functions/image-response.md).

The original Article design combined dynamic-segment metadata files with `generateImageMetadata`. Production builds on `16.3.0-preview.6` classified those image routes as request-rendered, while `16.2.12` and current canary builds could not collect their outer slug parameters. The static Route Handler design was verified on stable `16.2.12`: `generateStaticParams`, `dynamicParams = false`, and `dynamic = "force-static"` emit one prerendered body and metadata artifact per visible Article. The page metadata supplies each image URL, type, size, and alt explicitly. [Next.js Route Handler static-generation documentation](https://nextjs.org/docs/app/api-reference/file-conventions/route#static-generation-with-generatestaticparams).

Both Article endpoints share one pure image composition and the same renderer-neutral input rather than maintaining two designs. Their title-derived alt text is generated from the same Blog-owned title policy as the pixels.

## Static generation and caching contract

The social-image path consumes only repository-owned, validated data and checked-in local assets:

```text
Portfolio data / Blog social-image projection
                       |
                       v
thin metadata files / static Article Route Handlers
                       |
                       v
shared pure JSX composition + pinned local font/assets
                       |
                       v
next/og ImageResponse (1200×630 PNG)
                       |
                       v
Next build output and production cache
```

- Portfolio and Blog each have one static pair of metadata-image files.
- The Article segment has one pair of explicit PNG Route Handlers whose static parameters come from the same visible-slug projection as `/blog/[slug]`. Each Published Article is rendered during production build. Local development may additionally resolve Drafts.
- Rendering does not call `headers()`, `cookies()`, Draft Mode, `connection()`, a clock, random-number or UUID APIs, remote fetches, or uncached data. The pre-existing Blog collection boundary still validates authored publication dates against Zurich's build date before producing renderer inputs; that date never enters the input, layout, or PNG bytes. Article handlers set only `dynamic = "force-static"`; no image path sets `revalidate` or an Edge runtime.
- There is no ISR or on-demand regeneration. A content, font, asset, template, or renderer change produces a new deployment and new metadata-image output.
- Production social crawlers receive a built and cached asset; they do not pay rendering CPU or depend on the Article source filesystem.

This follows the established rule that production consumes static imports and Next-generated outputs rather than reading Article sources through `fs`. [Article compilation decision](https://github.com/levinbaenninger/website/issues/7).

## Output and alt-text contracts

Every generated social image has this output contract:

```ts
const size = { width: 1200, height: 630 } as const;
const contentType = "image/png";
```

Both Open Graph and Twitter use the same pixels and the same meaningful alt text:

- Portfolio: `Levin Bänninger — Portfolio`
- Blog: `Levin Bänninger — Blog`
- Article: `${title} — Levin Bänninger`

The Article value is derived from the validated title, never separately authored. Article page metadata applies it to both explicit image descriptors. The static Portfolio and Blog files export `alt` directly. There is no empty alt, filename alt, generic “social image” text, or renderer-authored fallback.

The dimensions are an explicit repository contract rather than reliance on `ImageResponse` defaults. Next maps `alt`, `size`, and `contentType` to the corresponding metadata tags. [Next.js Open Graph and Twitter image config exports](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image#config-exports). The Open Graph protocol recommends `og:image:alt` whenever an image is specified. [Open Graph structured image properties](https://ogp.me/#structured).

## Fonts, local assets, and deterministic output

Check the exact font files used by the image into the repository and load TTF or OTF bytes once at module scope. Check in any renderer-owned brand asset and pass its bytes as a data URL or `ArrayBuffer`; do not fetch fonts, emoji, logos, or backgrounds from a network during rendering. Next documents module-scope local font loading and Node filesystem loading for local image assets. [Next.js custom-font example](https://nextjs.org/docs/app/api-reference/functions/image-response#custom-fonts); [Next.js local-asset example](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image#using-nodejs-runtime-with-local-assets).

`ImageResponse` supports TTF, OTF, and WOFF, with TTF or OTF preferred for parse speed. Its complete image bundle has a documented 500 kB limit including JSX, CSS, fonts, images, and other assets. Keep the social-image asset set comfortably below that limit and fail the build rather than switching to a remote asset. [Next.js `ImageResponse` behavior](https://nextjs.org/docs/app/api-reference/functions/image-response#behavior).

Determinism means byte-identical output for repeated renders under the pinned repository toolchain, not a promise that pixels will never change across a Next.js upgrade. The implementation must:

1. use only canonical validated strings and fixed constants;
2. preserve explicit input ordering;
3. use pinned local font and image bytes;
4. avoid network, locale defaults, system fonts, time, randomness, and request state;
5. fix the renderer through the exact Next.js version;
6. render every required image twice in a determinism test and compare bytes;
7. require intentional golden-image review when Next.js or an owned visual input changes.

## Long-title behavior

The Article contract already limits a title to 1–100 Unicode characters. [Article metadata decision](https://github.com/levinbaenninger/website/issues/5). The social-image composition must additionally reserve a fixed title box, use a fixed font family/weight/size/line height, enable balanced wrapping, clamp to a fixed maximum number of lines, hide overflow, and use an ellipsis. Long unbroken text uses an explicit `wordBreak` policy. No runtime measuring loop, binary font search, title mutation, or layout chosen from the current machine is allowed.

Satori supports `textOverflow`, `wordBreak`, `textWrap: "balance"`, `overflow: "hidden"`, and `lineClamp`, which is enough to make this behavior explicit and testable. [Satori supported CSS and typography properties](https://github.com/vercel/satori#css). The exact font sizes, line-count value, and visual composition remain for visual design; this ticket only requires the bounded behavior and fixtures.

## Drafts, redirects, and absence

Image visibility follows Blog policy and is not an image-route option:

- Production builds, including preview deployments, generate Article images only for Published Articles.
- `vp dev` may resolve Draft images at their canonical Article URLs so the normal local preview surface is complete.
- A production-hidden Draft's current and former slugs have no generated image and return 404, matching the Article route.
- Former slugs do not receive separate social-image assets. Their permanent redirect leads crawlers to the canonical Article and its canonical image.
- Unknown and malformed slugs return 404; they do not receive a generic Blog or Portfolio image from the per-Article handler.

These rules preserve the existing decision that Drafts are local-only, that production excludes both their current and former routes, and that visible former slugs redirect directly to the canonical Article. [Draft behavior decision](https://github.com/levinbaenninger/website/issues/9); [Article redirect decision](https://github.com/levinbaenninger/website/issues/5).

## Repository boundaries

Per ADR 0001, `src/app` remains the thin Next.js boundary and modules do not import one another. [Module ownership ADR](../adr/0001-reserve-modules-for-product-capabilities.md).

- `src/app` owns four metadata-file adapters, two Article Route Handlers, their Next.js exports, static parameter wiring, explicit Article image metadata, and translation of missing Blog data to a 404.
- `@/modules/blog/articles` exposes focused server-only, framework-neutral social-image operations: a deterministic list of visible Article image parameters and lookup of the plain image input for one current slug. The input contains only data needed by the image and alt contracts; it does not expose the canonical Article record, compiled MDX, Next metadata, or `ImageResponse`.
- Portfolio exposes its renderer-neutral social-image input through its existing module public API. Blog and Portfolio remain independent.
- `src/shared` may own the deliberately foundational pure JSX composition, fixed output constants, font/brand asset loading, and `ImageResponse` construction because all three image families are named consumers. Shared imports neither product module.
- The Article Cover remains a distinct Blog concept, not an implicit social image. Whether a final composition visually includes it is a later design decision. [Project domain language](../../CONTEXT.md).

The metadata adapters obtain module data, pass it to the shared mechanism, and return its `ImageResponse`. They contain no Article parsing, visibility policy, redirect lookup, CSS design, or independent fallback data.

## Renderer comparison

| Candidate | Integration and runtime | Relevant capability | Cost and decision |
| --- | --- | --- | --- |
| **Installed `next/og`** | First-party metadata-file and Route Handler paths; Node and Edge entry points are bundled in the installed Next package; output is PNG through Satori and Resvg. | Flexbox/absolute layout, fixed local fonts and images, wrapping, balancing, line clamping, and ellipsis cover the required bounded card. | **Selected.** No direct package, native binary, or custom HTTP cache is added. Static rendering makes request throughput irrelevant. |
| **Takumi `2.5.2`** | `takumi-js` selects native Rust on Node and Wasm on Edge/Workers/browser. Its Next guide requires `@takumi-rs/core` in `serverExternalPackages` and demonstrates a generic Route Handler rather than Next metadata files. | Broader CSS including Grid/block layout, WOFF2/variable fonts, RTL, multiline truncation, and `textFit: "shrink"`; reusable renderers carry resource caches. | Viable but rejected. These capabilities are not requirements, while the package adds helpers, Wasm, platform-specific native packages, deployment configuration, and a second compatibility surface on top of Next.js. |
| **Direct Satori + Resvg** | Would recreate the two stages already owned and integrated by `next/og`. | Maximum control over SVG and rasterization versions. | Rejected as unnecessary. It adds direct renderer dependencies, response/header/cache wiring, and integration tests without satisfying a missing requirement. |

Takumi's official documentation says `takumi-js` bundles both `@takumi-rs/core` and `@takumi-rs/wasm`, uses native rendering on Node and Wasm on Edge, and that native rendering is multithreaded while Wasm is single-threaded. [Takumi introduction](https://takumi.kane.tw/docs/); [Takumi performance documentation](https://takumi.kane.tw/docs/performance-and-optimization); [Takumi Next.js integration](https://takumi.kane.tw/docs/integration/nextjs). The official registry metadata for `takumi-js@2.5.2` declares core, helpers, and Wasm as direct dependencies; the Wasm package is about 3.8 MB unpacked and a representative Linux x64 native package is about 6.1 MB unpacked. [`takumi-js` registry metadata](https://registry.npmjs.org/takumi-js/2.5.2); [`@takumi-rs/wasm` registry metadata](https://registry.npmjs.org/@takumi-rs/wasm/2.5.2); [`@takumi-rs/core-linux-x64-gnu` registry metadata](https://registry.npmjs.org/@takumi-rs/core-linux-x64-gnu/2.5.2).

Takumi's stronger text-fitting and typography are real, but unnecessary for a validated 100-character title with a deliberate clamp. [Takumi typography and text fitting](https://takumi.kane.tw/docs/typography-and-fonts). No focused third alternative closes a requirement gap, so none should be added.

## Verification matrix

| Surface | Fixture or check | Required assertion |
| --- | --- | --- |
| Renderer unit | Portfolio, Blog, normal Article, 100-character title, long unbroken token, punctuation/diacritics, and every supported glyph class | Returns PNG; exactly 1200×630; no overflow; title remains legible; fixed alt is correct. |
| Determinism | Render every fixture twice in one clean toolchain run | Byte-identical buffers and hashes. |
| Golden images | Checked-in representative PNG snapshots | Pixel diff is zero unless an intentional font, asset, template, or renderer update approves a new baseline. |
| Metadata integration | Built `/`, `/blog`, and one Published Article | Both OG and Twitter tags contain image URL, `image/png`, 1200, 630, and the expected alt. |
| Visibility | One Published Article and one Draft with former slugs | Production emits only Published current-slug images; Draft current/former and unknown slugs are 404; local development resolves the Draft current slug and its visible redirect. |
| Redirect | Request a visible former slug | Permanent redirect reaches the canonical Article; no former-slug image artifact exists. |
| Static build | Inspect `vp run build`, the prerender manifest, and built image bodies | Image routes are prerendered, not request-time renderers; paired bodies are stable, successful, and byte-identical. |
| Asset isolation | Block outbound network during image tests/build | All images still render; no remote font, image, or emoji request occurs. |
| Upgrade | Change `next`, a font, or an owned renderer asset | Determinism, golden, metadata, visibility, and production-build suites must all rerun; visual differences require review. |

Use PNG signature and decoded dimensions rather than trusting exported metadata alone. Also assert file-size limits and budget headroom: Next enforces at most 5 MB for a Twitter image and 8 MB for an Open Graph image, while the shared pixels should be comfortably below both. [Next.js social-image size limits](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image#image-files-jpg-png-gif).

## Boundary for follow-up tickets

This decision fixes the renderer, build-time lifecycle, metadata integration, OG/Twitter parity, output and alt contracts, deterministic input rules, title-overflow behavior, Draft/redirect behavior, ownership seams, and verification requirements.

It deliberately does not design the final composition, choose typography sizes, decide colors or ornament, implement the Blog operations, place the future Blog routes, or define the complete route metadata/discovery mapping. Those details remain with visual implementation and [Define Blog routes metadata and discovery outputs](https://github.com/levinbaenninger/website/issues/11).
