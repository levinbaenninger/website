# Choose the MDX and content-processing stack

Research for [Choose the MDX and content-processing stack](https://github.com/levinbaenninger/website/issues/4), captured on 2026-07-18 and amended on 2026-07-29 after production-build verification.

## Decision

Use Next.js's first-party local-file integration, `@next/mdx`, on its default JavaScript MDX compiler. Pin `@next/mdx` to the **same exact version** as `next` (`16.2.12`) and use MDX 3's official loader and React integration. Parse YAML frontmatter into a named MDX export with the focused `remark-frontmatter` + `remark-mdx-frontmatter` pair, then validate the exported value with Zod at the Blog's content-loading boundary. Configure remark/rehype plugins by package-name strings so the configuration is serializable by Turbopack. Do not enable the experimental Rust MDX compiler.

Add these direct production dependencies at the researched versions:

| Package | Version | Why it is direct |
| --- | --- | --- |
| `@next/mdx` | `16.2.12` | First-party Next.js configuration and local `.mdx` compilation. It must move in lockstep with `next`; do not accept a range or mismatched Next.js release. |
| `@mdx-js/loader` | `3.1.1` | The JavaScript compiler path used by `@next/mdx`; the installed Next.js guide explicitly includes it. |
| `@mdx-js/react` | `3.1.1` | The official React/provider integration and fallback component source used by `@next/mdx`; declaring it directly prevents an incidental peer/transitive version from defining behavior. |
| `remark-frontmatter` | `5.0.0` | Adds YAML frontmatter nodes to the Markdown AST. It recognizes frontmatter but does not create an importable metadata value. |
| `remark-mdx-frontmatter` | `5.2.0` | Converts the frontmatter AST node to a named MDX export. Its own documentation says it depends on the AST produced by `remark-frontmatter`, so **both plugins are required**, in that order. |
| `zod` | `4.4.3` | Runtime validation and typed inference for the exported, author-controlled metadata object. It must be direct even if another tool currently installs Zod transitively. |

Add one direct development dependency:

| Package | Version | Why it is development-only |
| --- | --- | --- |
| `@types/mdx` | `2.0.14` | TypeScript declarations for importing `.mdx` modules and `MDXComponents`; it emits no runtime code. |

The versions above are the current compatible releases verified for this repository, not a standing instruction to hold them forever. Upgrades should keep `next` and `@next/mdx` exactly equal, upgrade `@mdx-js/loader` and `@mdx-js/react` together within the same MDX release line, and run the Blog's full content/build verification before accepting any change.

## Why this satisfies the known constraints

### Repository-local Articles and static compilation

The installed Next.js 16.2 guide says `@next/mdx` sources local files, permits `.mdx` files to be imported from outside the route tree, compiles them to React/HTML, and supports Server Components in the App Router. The same guide demonstrates dynamic imports for slug-based routes plus `generateStaticParams` and `dynamicParams = false`. This is the shortest supported path from repository-owned Article source to statically generated routes, without introducing a second content framework or evaluating serialized MDX at request time. [Installed Next.js MDX guide](../../node_modules/next/dist/docs/01-app/02-guides/mdx.md) (sections “Install dependencies”, “Using imports”, and “Using dynamic imports”); [official Next.js MDX guide](https://nextjs.org/docs/app/guides/mdx).

The default JavaScript compiler is deliberate. The installed guide labels `mdxRs` experimental. The matching `@next/mdx` implementation selects `mdx-js-loader` unless `experimental.mdxRs` is enabled and installs an equivalent Turbopack rule when `TURBOPACK` is present. [`@next/mdx` implementation](https://github.com/vercel/next.js/tree/canary/packages/next-mdx); installed `mdxRs` reference at `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/mdxRs.md`.

### Frontmatter and validation

`@next/mdx` intentionally has no frontmatter support by default. The Next.js guide names `remark-frontmatter` and `remark-mdx-frontmatter` as supported solutions and shows that named MDX exports can be imported alongside the compiled component. `remark-frontmatter` only adds syntax/AST support; `remark-mdx-frontmatter` explicitly consumes that AST and emits `export const frontmatter = …`. Zod's `parse` API validates unknown input and returns a typed deep clone, which is the required validation step rather than treating YAML output as trusted TypeScript. [Next.js frontmatter guidance](https://nextjs.org/docs/app/guides/mdx#frontmatter); [`remark-frontmatter` repository](https://github.com/remarkjs/remark-frontmatter); [`remark-mdx-frontmatter` repository](https://github.com/remcohaszing/remark-mdx-frontmatter); [Zod parsing documentation](https://zod.dev/basics#parsing-data).

This ticket chooses the mechanism only. The Article metadata fields and invariants belong to [Define the Article source bundle and metadata schema](https://github.com/levinbaenninger/website/issues/5), while discovery, exhaustive validation, failure aggregation, and generated outputs belong to [Define the Article compilation and validation pipeline](https://github.com/levinbaenninger/website/issues/7).

### Approved components and assets

App Router requires a root `mdx-components.tsx` hook. Next.js uses it to map Markdown elements and make named React components available to MDX; local component maps can merge with or override the global map. In this repository that root file should remain a thin framework adapter that imports the Blog-owned registry directly, preserving the feature boundary. The exact allowed names, capabilities, enforcement, and server/client split remain for [Define MDX component and Article asset contracts](https://github.com/levinbaenninger/website/issues/10). [Next.js `mdx-components` convention](https://nextjs.org/docs/app/api-reference/file-conventions/mdx-components); [installed Next.js component examples](../../node_modules/next/dist/docs/01-app/02-guides/mdx.md#using-custom-styles-and-components); [feature-first architecture ADR](../adr/0002-adopt-a-feature-first-application-architecture.md).

No image plugin is needed. A colocated local image can use a normal static import in its Article and be passed to a registry-provided `Image` component; Next.js derives width, height, and blur data from static local imports. Remote images use URL strings, explicit dimensions (or `fill`), and narrowly configured `images.remotePatterns`. This preserves native Next.js image behavior and avoids an additional Markdown-image transform whose semantics would need separate maintenance. [Next.js image guide](https://nextjs.org/docs/app/getting-started/images#local-images); [remote image guidance](https://nextjs.org/docs/app/getting-started/images#remote-images); [image configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/images).

### Markdown transforms and Turbopack

`@next/mdx` already exposes `remarkPlugins` and `rehypePlugins`; no direct `remark`, `rehype`, `unified`, or `@mdx-js/mdx` dependency is needed. The installed preview guide says the ecosystem is ESM-only and, for Turbopack, documents package names (and serializable options) rather than imported JavaScript plugin functions because functions cannot be passed to Rust. Configure the required frontmatter pair as strings in this order:

```ts
remarkPlugins: ["remark-frontmatter", "remark-mdx-frontmatter"];
```

Future transforms should follow the same string/serializable-options form. Add a transform dependency only once a later specification requires that syntax or output; do not install a speculative bundle of GFM, heading, highlighting, or sanitizing plugins now. [Installed Next.js plugin guidance](../../node_modules/next/dist/docs/01-app/02-guides/mdx.md#remark-and-rehype-plugins); [official Next.js plugin guidance](https://nextjs.org/docs/app/guides/mdx#remark-and-rehype-plugins).

## Compatibility and maintenance evidence

- The npm registry publishes matching `next@16.2.12` and `@next/mdx@16.2.12` stable packages from the Next.js monorepo. The pair passed the repository's complete Article, MDX, static-generation, metadata-image, and production-build verification. The former `16.3.0-preview.6` pair compiled Articles but misclassified statically parameterized Article image Route Handlers as request-rendered. [npm registry metadata](https://registry.npmjs.org/@next%2fmdx/16.2.12); [`@next/mdx` source](https://github.com/vercel/next.js/tree/canary/packages/next-mdx).
- `@mdx-js/loader@3.1.1` and `@mdx-js/react@3.1.1` are the matching current MDX 3 releases, published 2025-08-29. Their package metadata points to the actively maintained MDX monorepo, whose repository activity continued in 2026. [MDX repository and releases](https://github.com/mdx-js/mdx); [loader package metadata](https://registry.npmjs.org/@mdx-js%2floader/3.1.1); [React package metadata](https://registry.npmjs.org/@mdx-js%2freact/3.1.1).
- `remark-mdx-frontmatter@5.2.0` was published 2025-06-04, targets `@mdx-js/mdx ^3` in its own tests, requires Node 18+, and documents the exact two-plugin composition selected here. That is compatible with this repository's Node 24 runtime and MDX 3. [package repository](https://github.com/remcohaszing/remark-mdx-frontmatter); [npm metadata](https://registry.npmjs.org/remark-mdx-frontmatter/5.2.0).
- `remark-frontmatter@5.0.0` is older (published 2023-09-18) but remains the latest stable release, is maintained under the unified/remark collective, and is the explicit upstream contract of the current `remark-mdx-frontmatter`. Its lack of releases reflects a small, stable syntax plugin rather than a superseded release line. [package repository](https://github.com/remarkjs/remark-frontmatter); [npm metadata](https://registry.npmjs.org/remark-frontmatter/5.0.0).
- `zod@4.4.3` was published 2026-05-04 and is the current stable registry release. Its supported TypeScript baseline is well below this repository's TypeScript 6.0. [Zod repository](https://github.com/colinhacks/zod); [npm metadata](https://registry.npmjs.org/zod/4.4.3); [Zod requirements](https://zod.dev/#requirements).

## Rejected alternatives

| Alternative | Why it is not selected |
| --- | --- |
| MDX metadata as handwritten JavaScript/TypeScript exports | It removes two small plugins, but gives up conventional YAML frontmatter and mixes executable author code into metadata. It does not remove the need for runtime schema validation. |
| `gray-matter` | It can parse frontmatter for a separate filesystem index, but `@next/mdx` would still need the frontmatter removed or transformed during compilation. That creates two parse paths and possible disagreement. The selected pair parses once into the compiled module export. |
| Direct `@mdx-js/mdx` compilation | Viable for a bespoke artifact generator, but it recreates Next.js loader/provider/bundler integration and adds ownership for compiled-code execution. `@next/mdx` already supplies the required local, Server Component, Webpack, and Turbopack integration. |
| `next-mdx-remote` | Designed for serialized/remote strings and runtime evaluation. Canonical content here is repository-local and deployment-coupled, so it adds an unnecessary execution and compatibility layer. |
| Contentlayer, Velite, or another content framework | These add a parallel schema/build/cache abstraction before the Article contracts are even specified, increase dependency and upgrade surface, and are not needed to satisfy any standing decision. |
| `react-markdown` | Renders Markdown as React but is not an MDX module compiler: it does not provide the required MDX component/export model or native Next.js local-module integration. Its presence elsewhere in the current dependency graph does not make it part of the Blog stack. |
| Experimental `mdxRs` | The installed Next.js documentation explicitly labels it experimental. The default JavaScript compiler supports the required plugin seam without taking on that extra experimental surface. |
| Eager transform bundle (`remark-gfm`, heading slugs, code highlighting, sanitizing, etc.) | The exact Article syntax and output have not been specified. Every transform adds semantics and maintenance cost; the chosen stack leaves both plugin seams open and adds focused packages only when a resolved contract requires them. |

## Boundary for follow-up tickets

This decision fixes the compiler family, dependency ownership, frontmatter export/validation mechanism, component-provider seam, transform configuration form, and native asset path. It intentionally does **not** decide Article fields, generated artifacts, discovery/ordering, registry names, import restrictions, image policy details, diagnostics, or transform semantics. Those remain with the already-charted schema, pipeline, and component/asset tickets.
