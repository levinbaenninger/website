# Personal Website

Levin's visitor-facing Portfolio and Blog, built as a single Next.js application.

## Development

```bash
vp install
vp run dev
```

Vite+ manages the pinned pnpm and Node runtimes. Product code lives in the independent `src/features/blog` and `src/features/portfolio` features; Next.js adapters and application composition live in `src/app`; product-neutral foundations live in `src/shared`.

## Validation

```bash
vp check
vp test
vp run architecture
vp run build
vp run e2e
```

`vp run verify` runs the production build, browser journeys, Fallow architecture and regression gates, static checks, and Vitest suite. The build requires network access for the GitHub contributions request.

## Architecture

Dependencies flow from the application to features and shared foundations, and from each feature to shared foundations. Features cannot import peer features. Application code imports feature files directly; feature barrel entrypoints are not used. Fallow owns these architecture rules in `.fallowrc.jsonc`.
