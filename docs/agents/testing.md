# Testing

This project uses Vitest through Vite+. Read this guide before adding or reviewing tests. The upstream [Writing Tests with AI](https://vitest.dev/guide/learn/writing-tests-with-ai.html) guide is the baseline for AI-assisted test work.

## Before writing a test

Read the behavior's source, its public caller or consumer, the nearest existing tests, and the `test` configuration in `vite.config.ts`. Read dependency types when a boundary may need a fake. Identify the concrete behavior or regression the test must prove, including important empty, boundary, and failure cases.

Do not add a test merely to exercise a line or mirror the current implementation. A test earns its maintenance cost when failure would describe a meaningful broken contract.

## Test the observable contract

- Assert outputs a caller or visitor can observe: return values, rendered semantics, accessibility state, responses, persisted effects, and reported errors.
- Prefer public entry points and realistic collaborators. A refactor that preserves behavior should normally preserve the test.
- Do not assert private helper calls, internal call order, incidental markup, generated variable names, or source-code strings.
- Use a structural test only for an architectural boundary that cannot be expressed through linting, types, a build, or a public behavior test. State the boundary in the test name and avoid checks that formatting can break.
- Type tests are appropriate for deliberate public compile-time contracts, but they do not replace runtime behavior tests.

Keep names short and behavioral, such as `rejects a future publication date` or `reveals a linked heading`. Group tests only when the group makes failures easier to scan. Prefer a small fixture builder over repeated setup, and keep assertions specific enough that an unrelated value or error cannot pass.

## Placement and environments

- Keep focused unit and component tests beside the implementation as `src/**/*.test.ts(x)` when they exercise feature-owned behavior through its public interface.
- Put workflows spanning multiple areas of one feature in `src/features/<feature>/__tests__`.
- Keep focused Next.js adapter tests beside their adapter. Put multi-file shared-foundation integrations in the owning shared mechanism's `__tests__` folder.
- Use `*.dom.test.tsx` only when the test needs DOM APIs or user interaction. These files run in the configured Happy DOM project. All other tests run in the Node project.
- Exercise interactions with Testing Library roles, labels, visible content, and `userEvent`. Use selectors only when no accessible query represents the contract.

## Mocks and controlled inputs

Use real code when it is fast and deterministic. Control only true boundaries, such as the network, clock, browser API, filesystem edge, or an expensive third-party engine.

- Prefer dependency injection or a small boundary fake over mocking many modules.
- Assert the resulting behavior, not just that a mock was called.
- Use Vitest APIs (`vi`), imported from `vite-plus/test`; do not use Jest APIs.
- Prefer type-safe module mocks with `vi.mock(import("…"), factory)` when a module mock is necessary.
- Restore spies, globals, timers, storage, and directly replaced browser properties after every test. A passing test must not depend on execution order.

Snapshots and golden images are for stable, reviewed output whose full shape matters. Do not update them merely to make a failure pass. Review the change visually or semantically, then use the dedicated update task when the change is intentional.

## Run and review

Use the project runner:

```bash
vp test path/to/file.test.ts
vp test
vp test --coverage
```

Unlike raw Vitest, `vp test` runs once by default; `vp test watch` is explicitly interactive. Before finishing a code change, also follow the full validation sequence in [Toolchain](toolchain.md).

Coverage is informational and has no pass/fail threshold. It uses the V8 provider and includes all eligible TypeScript and TSX files under `src`, including files that no test imports. Reports are written to `coverage/` in text, JSON summary, JSON detail, and HTML formats.

Review every AI-generated test as a first draft:

1. Confirm it fails for the intended broken behavior and passes for the right reason.
2. Replace weak assertions such as “is defined” or “does not throw” with the exact public outcome.
3. Remove redundant cases and implementation-coupled expectations.
4. Add the important empty, boundary, malformed-input, and dependency-failure scenarios.
5. Run the targeted test, then the full suite, and check that mocks and globals cannot leak between tests.
