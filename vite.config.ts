import { fileURLToPath } from "node:url";

import ultracite from "ultracite/oxfmt";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";
import { defineConfig } from "vite-plus";

const blogTool = (subcommand: string): string =>
  `node --experimental-strip-types src/features/blog/tooling/cli.ts ${subcommand}`;

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
        command:
          "fallow dead-code --regression-baseline .fallow-regression.json --fail-on-regression --format compact && fallow dupes --baseline .fallow-dupes-baseline.json --format compact && fallow health --complexity --baseline .fallow-health-baseline.json --baseline-mode identity --format compact",
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
          "SOCIAL_IMAGE_GOLDENS=review vp test tests/shared/social-image/social-image.test.tsx",
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
    extends: [core, next, react],
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
        files: [`**/*.{test,spec}.{ts,tsx}`],
        rules: {
          "promise/avoid-new": "off",
          "typescript/no-unsafe-assignment": "off",
          "typescript/no-unsafe-type-assertion": "off",
        },
      },
    ],
    rules: {
      "import/no-relative-parent-imports": "error",
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
          include: [
            "src/**/*.{test,spec}.{ts,tsx}",
            "tests/**/*.{test,spec}.{ts,tsx}",
          ],
          exclude: ["**/*.dom.test.{ts,tsx}"],
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "happy-dom",
          include: [
            "src/**/*.dom.test.{ts,tsx}",
            "tests/**/*.dom.test.{ts,tsx}",
          ],
          setupFiles: ["./tests/setup/react-dom.ts"],
        },
      },
    ],
  },
});
