# Toolchain

This project uses Vite+ as its unified command entrypoint. Vite+ manages the pnpm runtime and wraps Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task.

Local documentation is available in `node_modules/vite-plus/docs`. Online documentation is available at <https://viteplus.dev/guide/>.

## Commands

Project tasks live in the `run.tasks` block of `vite.config.ts`. `package.json#scripts` only keeps lifecycle hooks such as `prepare`.

| Task | What it does |
| --- | --- |
| `vp run dev` | Runs `blog:generate`, then starts **mprocs** with `site` (`next dev`) and `articles` (manifest watch). Use ↑/↓ to switch panes; `q` to quit. |
| `vp run build` | Runs `blog:check`, then `next build`. |
| `vp run e2e` | Runs `build` once, starts the production site with `next start`, then runs the visitor journeys in desktop Chromium, desktop Firefox, and mobile WebKit. |
| `vp run verify` | Runs `build`, all Playwright projects, `vp check`, and `vp test`. |
| `vp run blog:generate` | Regenerates the committed Article manifest from source files. |
| `vp run blog:check` | Validates Article source bundles and manifest drift. |
| `vp run blog:watch` | Keeps the Article manifest in sync while you edit source files. Started automatically by `dev`; run alone only if needed. |
| `vp run update:social-image-snapshots` | Refreshes reviewed Open Graph / Twitter reference PNGs after intentional visual changes. |

Built-in Vite+ commands (not task-runner aliases):

- `vp check` — format, lint, and type-check.
- `vp test` — run tests.
- `vp test --coverage` — run tests and write informational coverage reports to `coverage/`.
- `vp install` — install dependencies after pulling lockfile changes.

Do not use `vp build` or `vp dev` for this Next.js app. Those invoke Vite's built-in dev/build commands. Use `vp run dev` and `vp run build` instead.

To preview a production build locally after `vp run build`, run `next start` (standard Next.js; not wrapped as a task).

## Validation

Before completing a code change:

1. Run `vp check`.
2. Run `vp test`.
3. Inspect `vite.config.ts` for additional task-specific validation.
4. Run `vp run build` with network access; static rendering fetches data from the external GitHub contributions API.
5. Run `vp run e2e` for changes that affect visitor journeys or their production runtime.

## Troubleshooting

If setup, runtime, or package-manager behavior is unexpected, run `vp env doctor` and include its output when requesting help.
