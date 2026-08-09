---
status: accepted
---

# Adopt a feature-first application architecture

Adapt Helvetic Studio's Bulletproof React conventions to this repository as a single Next.js application, without copying its monorepo structure. The migration preserves visitor-facing behavior as one coherent architectural change covering source ownership, test placement, selected browser journeys, Fallow enforcement, CI, agent guidance, and documentation. This ADR supersedes ADR-0001.

Blog and Portfolio are the initial top-level features. Their internal responsibility folders remain implementation structure rather than peer features; a new top-level feature requires an independently meaningful workflow and a clean dependency direction. Application code imports explicit feature files directly instead of consuming barrel entrypoints, while architectural enforcement prevents peer-feature and reverse-layer imports. Shared code remains grouped by cohesive product-neutral mechanisms such as UI, audio, branding, social images, and XML rather than global artifact buckets for hooks, utilities, or types.

The Next.js route tree owns only framework exports and adapters, including route handlers, metadata and image exports, layouts, response construction, and route composition. Feature-owned policy and framework-neutral behavior stay in the feature; mixed files are split at that seam instead of moving the current `src/app/_blog` tree wholesale into either layer.

App-wide implementation is consolidated into a small set of router-private technical folders under `src/app`, such as `_components`, `_config`, and `_providers`, instead of separate top-level private areas for shell, theme, site identity, development tools, and not-found presentation. The underscore expresses exclusion from Next.js routing, not a separate architectural layer.

Within a feature, a **feature area** groups an internal responsibility such as Blog articles, catalog, rendering, search, content, or tooling. Feature areas are organizational rather than independently enforced dependency units and may collaborate within their owning feature. An area may add technical folders such as `components`, `hooks`, `lib`, or `types` when they contain a meaningful group; otherwise files remain colocated. Feature-level technical folders are reserved for code genuinely used by multiple areas. The architecture does not use the terms subfeature or nested module.

Focused unit and component tests live beside their subjects. A workflow integration spanning multiple areas of one feature lives in `src/features/<feature>/__tests__`; a focused Next.js adapter test remains beside its adapter; and a multi-file shared-foundation integration may use the owning shared mechanism's `__tests__`. The mirrored root `tests/` source tree is removed, with global test setup kept outside that ownership mirror. Playwright specifications live in the application-level `e2e/` directory.

The initial browser journeys cover global Portfolio/Blog navigation with persisted theme, Blog search and Tag-filter discovery through opening an Article, direct Article reading with its navigation and interactive content, and recovery from an unknown route through the custom not-found experience. Draft visibility, generated manifests, metadata, RSS, sitemap, and social-image contracts remain covered below the browser level and through production-build validation.

Playwright runs those journeys in three projects on every pull request: desktop Chromium, desktop Firefox, and mobile WebKit using a Mobile Safari profile. This covers all three supported browser engines and one mobile form factor without duplicating WebKit across desktop and mobile projects; the matrix may be reduced on pull requests only if suite growth later makes its measured feedback time disproportionate.

The Playwright projects share one production build served through `next start`. The existing build-time GitHub contributions request remains an allowed external build dependency, but browser assertions do not depend on its changing values.

Fallow is the sole authority for architectural boundaries, using explicit application, Blog, Portfolio, and shared zones adapted from its Bulletproof model. The built-in preset's unused server zone is deliberately omitted. The duplicated module-specific Oxlint import restrictions are removed while Oxlint continues to enforce local code-quality rules. Architecture violations, dependency cycles, and source files that match no zone have zero tolerance across the repository. Dead-code, duplication, and complexity findings use a reviewed post-migration baseline and fail on new regressions. Suppressions are narrow and justified rather than disabling rule families.

Fallow's generated agent hook gates Claude-issued `git commit` and `git push` commands, while repository guidance requires the equivalent audit for agents the hook cannot intercept and CI remains the universal enforcement boundary. The ordinary Git pre-commit hook remains limited to staged formatting and local checks.

The migration performs a clean cutover from `src/modules` to `src/features`: it does not retain compatibility aliases, duplicate paths, or legacy barrel entrypoints. No `src/server` zone is introduced initially; it is added only if infrastructure with multiple independent feature consumers actually appears.

Root build configuration is application composition and may directly invoke designated feature-owned build entrypoints, such as the Blog compiler from `next.config.ts` and Blog tooling from Vite+ tasks. Those entrypoints remain inside the owning feature; the repository does not introduce a generic top-level tooling layer to conceal the dependency, and feature code never imports root configuration.

Coverage remains evidence rather than a numeric target. Reports support review and Fallow gap/regression analysis, while tickets require behavior-specific tests instead of a global percentage threshold. The agreed Playwright journeys are introduced and made green against the current application before the source-layout cutover, then remain the behavioral baseline throughout the migration.
