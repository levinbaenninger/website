# Toolchain

This project uses Vite+ as its unified command entrypoint. Vite+ manages the pnpm runtime and wraps Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task.

Local documentation is available in `node_modules/vite-plus/docs`. Online documentation is available at <https://viteplus.dev/guide/>.

## Commands

- After pulling dependency changes, run `vp install`.
- Use `vp dev` for local development.
- Use `vp check` to format, lint, and type-check.
- Use `vp test` to run tests.
- Use `vp run <script>` for scripts declared in `package.json` and tasks declared in `vite.config.ts`.
- Use `vp run build` for the Next.js production build. Do not use `vp build`, which invokes Vite's built-in production build instead of the package script.

## Validation

Before completing a code change:

1. Run `vp check`.
2. Run `vp test`.
3. Inspect `vite.config.ts` and `package.json` for additional task-specific validation.
4. Run `vp run build` with network access; static rendering fetches data from the external GitHub contributions API.

## Troubleshooting

If setup, runtime, or package-manager behavior is unexpected, run `vp env doctor` and include its output when requesting help.
