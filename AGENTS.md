# Personal Website

This is Levin's Next.js personal website, containing the visitor-facing Portfolio and Blog.

## Essentials

- The package manager is pnpm 11.17.0, managed through Vite+ (`vp`).
- Install dependencies with `vp install`.
- Run static validation and type checking with `vp check`.
- Run tests with `vp test`.
- Run architecture validation with `vp run architecture`.
- Use `vp run dev` for local development.
- Use `vp run build` for the Next.js production build; it requires network access because static rendering fetches the external GitHub contributions API.
- Before committing or pushing, run `fallow audit --base <upstream-ref>`; the generated Claude hook enforces the same audit automatically.

## Architecture

- `src/app` owns Next.js adapters and application composition.
- `src/features/blog` and `src/features/portfolio` are independent peer features. Import their implementation files directly; do not add feature barrels.
- `src/shared` owns product-neutral foundations and never imports from the application or a feature.
- Dependencies flow from app to features/shared and from each feature to shared. Run `fallow guard <files>` before architecture-sensitive edits.

## Task-specific guidance

Read only the guides relevant to the task:

- [Toolchain](docs/agents/toolchain.md) — dependency management, commands, validation, and troubleshooting
- [Testing](docs/agents/testing.md) — test selection, placement, behavior-focused assertions, mocking, and AI-generated test review
- [Next.js](docs/agents/nextjs.md) — required local documentation lookup before Next.js work
- [Domain documentation](docs/agents/domain.md) — domain vocabulary and architectural decisions
- [Issue tracker](docs/agents/issue-tracker.md) — GitHub issue and PRD operations
- [Triage labels](docs/agents/triage-labels.md) — mapping skill roles to repository labels

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
