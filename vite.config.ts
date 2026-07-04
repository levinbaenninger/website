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
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
      "sort-keys": "off",
    },
    options: { typeAware: true, typeCheck: true },
  },
});
