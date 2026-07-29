import { fileURLToPath } from "node:url";

import ultracite from "ultracite/oxfmt";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";
import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("src", import.meta.url)),
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
        files: ["src/shared/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
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
        files: ["src/modules/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
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
        files: ["src/modules/portfolio/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
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
        files: ["src/modules/blog/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
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
        files: ["src/app/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
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
        files: ["tests/app/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              paths: [
                {
                  name: "@/modules",
                  message:
                    "App tests must consume a specific product module entrypoint.",
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
                    "App tests must consume a product module through its public entrypoint.",
                },
              ],
            },
          ],
        },
      },
      {
        files: [
          "src/modules/blog/tooling/cli.ts",
          "src/modules/blog/tooling/source-manifest.ts",
        ],
        rules: {
          "no-await-in-loop": "off",
          "prefer-destructuring": "off",
          "prefer-named-capture-group": "off",
          "unicorn/no-await-expression-member": "off",
        },
      },
      {
        files: ["src/modules/blog/tooling/cli.ts"],
        rules: {
          "promise/avoid-new": "off",
        },
      },
      {
        files: ["src/modules/blog/tooling/media.ts"],
        rules: {
          complexity: "off",
          "no-negated-condition": "off",
          "prefer-destructuring": "off",
          "prefer-named-capture-group": "off",
          "typescript/no-unsafe-type-assertion": "off",
          "unicorn/no-negated-condition": "off",
        },
      },
      {
        files: ["src/modules/blog/tooling/source-manifest.test.ts"],
        rules: {
          "no-await-in-loop": "off",
          "prefer-destructuring": "off",
          "typescript/no-unsafe-assignment": "off",
          "typescript/no-unsafe-type-assertion": "off",
        },
      },
      {
        files: ["src/modules/blog/rendering/contract.test.ts"],
        rules: {
          "promise/avoid-new": "off",
        },
      },
      {
        files: ["src/modules/blog/rendering/contract.ts"],
        rules: {
          complexity: "off",
          "no-loop-func": "off",
          "prefer-named-capture-group": "off",
          "typescript/no-unsafe-type-assertion": "off",
        },
      },
      {
        files: ["src/modules/blog/rendering/interactions.test.tsx"],
        rules: {
          "promise/prefer-await-to-callbacks": "off",
        },
      },
    ],
    rules: {
      "import/no-relative-parent-imports": "error",
      "typescript/no-require-imports": "error",
      "vite-plus/prefer-vite-plus-imports": "error",
      "sort-keys": "off",
    },
    options: { typeAware: true, typeCheck: true },
  },
});
