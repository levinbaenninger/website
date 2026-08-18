import { fileURLToPath } from "node:url";

import ultracite from "ultracite/oxfmt";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";
import vitest from "ultracite/oxlint/vitest";
import { defineConfig } from "vite-plus";

const blogTool = (subcommand: string): string =>
  `node src/features/blog/tooling/cli.ts ${subcommand}`;

// Vitest unit tests use `.test.*`; `e2e/*.spec.ts` belongs to Playwright, so
// the ultracite vitest preset must not lint spec files. The preset's own
// override outranks local ones, so repo-convention relaxations live here:
// tests assert whole behaviors in single cases and shape fixtures with
// assertions, so describe wrappers, expect budgets, and typed mocks add no
// signal.
const vitestTestsOnly: typeof vitest = {
  ...vitest,
  overrides: (vitest.overrides ?? []).map((override) => ({
    ...override,
    files: ["**/*.test.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}"],
    rules: {
      ...override.rules,
      "vitest/max-expects": "off",
      "vitest/require-mock-type-parameters": "off",
      "vitest/require-top-level-describe": "off",
    },
  })),
};

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("src", import.meta.url)),
    },
  },
  run: {
    tasks: {
      dev: {
        command: "mprocs",
        dependsOn: ["blog:generate"],
        cache: false,
      },
      build: {
        command: "next build",
        dependsOn: ["blog:check"],
        cache: false,
      },
      e2e: {
        command: "playwright test",
        dependsOn: ["build"],
        cache: false,
      },
      architecture: {
        command:
          "fallow dead-code --boundary-violations --circular-deps --fail-on-issues",
        cache: false,
      },
      fallow: {
        // Advisory surfacing of duplication and complexity; the zero-tolerance
        // gates live in `architecture` and the changed-code `fallow audit`.
        command:
          "fallow dupes --format compact && fallow health --complexity --report-only --format compact",
        dependsOn: ["architecture"],
        cache: false,
      },
      verify: {
        command: "vp check && vp test",
        dependsOn: ["e2e", "fallow"],
        cache: false,
      },
      "blog:generate": {
        command: blogTool("generate"),
        input: [
          { pattern: "src/features/blog/content/**", base: "workspace" },
          { pattern: "src/features/blog/tooling/**", base: "workspace" },
        ],
        output: [
          {
            pattern: "src/features/blog/articles/manifest.generated.ts",
            base: "workspace",
          },
        ],
      },
      "blog:check": {
        command: blogTool("check"),
        cache: false,
      },
      "blog:watch": {
        command: blogTool("watch"),
        cache: false,
      },
      "update:social-image-snapshots": {
        command:
          "SOCIAL_IMAGE_GOLDENS=review vp test src/shared/social-image/__tests__/social-image.test.tsx",
        cache: false,
      },
    },
  },
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ...ultracite,
    ignorePatterns: [
      ...(ultracite.ignorePatterns ?? []),
      ".claude/settings.local.json",
    ],
    sortTailwindcss: {
      stylesheet: "src/app/globals.css",
      functions: ["clsx", "cn"],
      preserveWhitespace: true,
    },
  },
  lint: {
    extends: [core, next, react, vitestTestsOnly, antiSlop],
    ignorePatterns: core.ignorePatterns,
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    overrides: [
      {
        files: ["src/features/blog/tooling/**/*.ts"],
        rules: {
          "no-await-in-loop": "off",
        },
      },
      {
        files: [
          "src/features/blog/tooling/media.ts",
          "src/features/blog/rendering/contract.ts",
        ],
        rules: {
          complexity: "off",
          "no-loop-func": "off",
        },
      },
      {
        // The rendering contract parses untyped MDX/hast nodes; typeof-driven
        // discrimination and boundary assertions are its domain.
        files: ["src/features/blog/rendering/contract.ts"],
        rules: {
          "anti-slop/no-runtime-typeof": "off",
          "anti-slop/require-safety-comment-for-type-assertion": "off",
        },
      },
      {
        // Boundary parsers and type guards take `unknown` by definition; the
        // rule has no carve-out for type predicates.
        files: [
          "src/features/blog/articles/metadata.ts",
          "src/features/blog/rendering/contract.ts",
          "src/features/blog/rendering/panel-contract.ts",
          "src/features/blog/rendering/code/code-tabs-contract.ts",
          "src/features/blog/search/contract.ts",
          "src/features/blog/tooling/**",
        ],
        rules: {
          "anti-slop/no-unknown-parameters": "off",
        },
      },
      {
        // Serialized panel JSON narrows through Record<string, unknown>.
        files: ["src/features/blog/rendering/panel-contract.ts"],
        rules: {
          "anti-slop/no-unsafe-dictionary-type": "off",
        },
      },
      {
        // Reflect.apply bridges unified's callback-style Transformer type
        // without a fabricated VFile or an unsafe assertion.
        files: ["src/features/blog/rendering/code/code.ts"],
        rules: {
          "anti-slop/no-reflect-apply": "off",
        },
      },
      {
        files: [`**/*.{test,spec}.{ts,tsx}`, "**/__tests__/**/*.{ts,tsx}"],
        rules: {
          "promise/avoid-new": "off",
          "typescript/no-unsafe-assignment": "off",
          "typescript/no-unsafe-type-assertion": "off",
          "anti-slop/no-chained-type-assertions": "off",
          "anti-slop/no-unknown-parameters": "off",
          "anti-slop/no-unsafe-dictionary-type": "off",
          "anti-slop/require-safety-comment-for-type-assertion": "off",
        },
      },
    ],
    rules: {
      "import/no-relative-parent-imports": "error",
      "react/function-component-definition": "off",
      "typescript/no-require-imports": "error",
      "vite-plus/prefer-vite-plus-imports": "error",
      "no-negated-condition": "off",
      "prefer-destructuring": "off",
      "prefer-named-capture-group": "off",
      "promise/prefer-await-to-callbacks": "off",
      "sort-keys": "off",
      "unicorn/no-negated-condition": "off",
    },
    options: { typeAware: true, typeCheck: true },
  },
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.{test,spec}.{ts,tsx}",
        "**/*.d.ts",
        "**/*.generated.{ts,tsx}",
      ],
      reporter: ["text", "json-summary", "json", "html"],
      reportOnFailure: true,
    },
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.{test,spec}.{ts,tsx}"],
          exclude: ["**/*.dom.test.{ts,tsx}"],
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "happy-dom",
          include: ["src/**/*.dom.test.{ts,tsx}"],
        },
      },
    ],
  },
});
