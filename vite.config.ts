import { fileURLToPath } from "node:url";

import ultracite from "ultracite/oxfmt";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";
import { defineConfig } from "vite-plus";

const blogTool = (subcommand: string): string =>
  `node --experimental-strip-types src/modules/blog/tooling/cli.ts ${subcommand}`;

const source = "*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}";

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
      verify: {
        command: "vp check && vp test",
        dependsOn: ["e2e"],
        cache: false,
      },
      "blog:generate": {
        command: blogTool("generate"),
        input: [
          { pattern: "src/modules/blog/content/**", base: "workspace" },
          { pattern: "src/modules/blog/tooling/**", base: "workspace" },
        ],
        output: [
          {
            pattern: "src/modules/blog/articles/manifest.generated.ts",
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
        files: [`src/shared/**/${source}`],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              paths: [
                {
                  name: "@/app",
                  message: "Shared foundations cannot depend on app.",
                },
                {
                  name: "@/modules",
                  message:
                    "Shared foundations cannot depend on product modules.",
                },
              ],
              patterns: [
                {
                  group: ["@/app/**", "@/modules/**"],
                  message:
                    "Shared foundations cannot depend on app or product modules.",
                },
              ],
            },
          ],
        },
      },
      {
        files: [`src/modules/**/${source}`],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              paths: [
                {
                  name: "@/app",
                  message: "Product modules cannot depend on app.",
                },
                {
                  name: "@/modules",
                  message: "Product modules cannot import the modules root.",
                },
              ],
              patterns: [
                {
                  group: ["@/app/**", "@/modules/**"],
                  message:
                    "Product modules cannot depend on app or peer modules; use relative imports within the module.",
                },
              ],
            },
          ],
        },
      },
      {
        files: [`src/modules/portfolio/**/${source}`],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              paths: [
                {
                  name: "@/app",
                  message: "Portfolio cannot depend on app.",
                },
                {
                  name: "@/modules",
                  message: "Portfolio cannot import the modules root.",
                },
                {
                  name: "@/modules/portfolio",
                  message:
                    "Portfolio internals must not import their public entrypoint.",
                },
              ],
              patterns: [
                {
                  group: ["@/app/**"],
                  message: "Portfolio cannot depend on app.",
                },
                {
                  group: [
                    "@/modules/*",
                    "@/modules/*/**",
                    "!@/modules/portfolio",
                    "!@/modules/portfolio/**",
                  ],
                  message: "Portfolio cannot depend on peer modules.",
                },
              ],
            },
          ],
        },
      },
      {
        files: [`src/modules/blog/**/${source}`],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              paths: [
                {
                  name: "@/app",
                  message: "Blog cannot depend on app.",
                },
                {
                  name: "@/modules",
                  message: "Blog cannot import the modules root.",
                },
                {
                  name: "@/modules/blog",
                  message:
                    "Blog internals must not import their public entrypoint.",
                },
              ],
              patterns: [
                {
                  group: ["@/app/**"],
                  message: "Blog cannot depend on app.",
                },
                {
                  group: [
                    "@/modules/*",
                    "@/modules/*/**",
                    "!@/modules/blog",
                    "!@/modules/blog/**",
                  ],
                  message: "Blog cannot depend on peer modules.",
                },
              ],
            },
          ],
        },
      },
      {
        files: [`src/app/**/${source}`, `tests/app/**/${source}`],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              paths: [
                {
                  name: "@/modules",
                  message:
                    "App code must consume a specific product module entrypoint.",
                },
              ],
              patterns: [
                {
                  group: [
                    "@/modules/*/**",
                    "!@/modules/blog/articles",
                    "!@/modules/blog/search",
                    "!@/modules/blog/search/artifact",
                  ],
                  message:
                    "App code must consume a product module through its public entrypoint.",
                },
              ],
            },
          ],
        },
      },
      {
        files: [
          "src/modules/blog/tooling/**/*.ts",
          "tests/modules/blog/tooling/**/*.ts",
        ],
        rules: {
          "no-await-in-loop": "off",
        },
      },
      {
        files: [
          "src/modules/blog/tooling/media.ts",
          "src/modules/blog/rendering/contract.ts",
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
