import ultracite from "ultracite/oxfmt";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";
import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ...ultracite,
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
        files: ["src/app/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              patterns: [
                {
                  group: ["@/modules/*/**"],
                  message:
                    "App code must consume a product module through its public entrypoint.",
                },
              ],
            },
          ],
        },
      },
    ],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
      "sort-keys": "off",
    },
    options: { typeAware: true, typeCheck: true },
  },
});
