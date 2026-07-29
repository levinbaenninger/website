import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import css from "@shikijs/langs/css";
import diff from "@shikijs/langs/diff";
import html from "@shikijs/langs/html";
import javascript from "@shikijs/langs/javascript";
import json from "@shikijs/langs/json";
import jsx from "@shikijs/langs/jsx";
import markdown from "@shikijs/langs/markdown";
import mdx from "@shikijs/langs/mdx";
import bash from "@shikijs/langs/shellscript";
import tsx from "@shikijs/langs/tsx";
import typescript from "@shikijs/langs/typescript";
import yaml from "@shikijs/langs/yaml";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import {
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { createTransformerFactory, rendererRich } from "@shikijs/twoslash/core";
import { createDefaultMapFromNodeModules } from "@typescript/vfs";
import type { Element, Root } from "hast";
import { createHighlighterCore } from "shiki/core";
import type { ThemeRegistration } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import { createTwoslasher } from "twoslash/core";
import ts from "typescript";
import { visit } from "unist-util-visit";

import { isArticleCodeTheme } from "./code-theme-contract.ts";
import type {
  ArticleCodeTheme,
  ArticleCodeThemes,
} from "./code-theme-contract.ts";

interface ArticleCodePluginOptions {
  readonly themes: ArticleCodeThemes;
}

const languageAliases = {
  bash: "shellscript",
  js: "javascript",
  md: "markdown",
  ts: "typescript",
} as const;

const require = createRequire(import.meta.url);
const reactPackagePath = require.resolve("@types/react/package.json");
const reactDirectory = path.dirname(reactPackagePath);
const csstypeEntry = path.resolve(
  reactDirectory,
  "..",
  "..",
  "csstype",
  "index.d.ts"
);
const TWOSLASH_LIBRARIES = ["lib.es2022.d.ts", "lib.dom.d.ts"];
const TWOSLASH_TARGET = ts.ScriptTarget.ES2022;
const twoslashFileSystem = createDefaultMapFromNodeModules(
  {
    lib: TWOSLASH_LIBRARIES,
    target: TWOSLASH_TARGET,
  },
  ts
);

for (const declaration of ["global.d.ts", "index.d.ts", "jsx-runtime.d.ts"]) {
  twoslashFileSystem.set(
    `/node_modules/@types/react/${declaration}`,
    readFileSync(path.join(reactDirectory, declaration), "utf-8")
  );
}
twoslashFileSystem.set(
  "/node_modules/@types/react/package.json",
  readFileSync(reactPackagePath, "utf-8")
);
twoslashFileSystem.set(
  "/node_modules/csstype/index.d.ts",
  readFileSync(csstypeEntry, "utf-8")
);

const twoslasher = createTwoslasher({
  cache: true,
  compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX,
    lib: TWOSLASH_LIBRARIES,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    strict: true,
    target: TWOSLASH_TARGET,
    types: ["react"],
  },
  fsMap: twoslashFileSystem,
  fsCache: false,
  tsModule: ts,
  vfsRoot: "/blog-twoslash",
});
const transformerTwoslash = createTransformerFactory(
  twoslasher,
  rendererRich()
);

const themeLoaders = {
  "github-dark": async () => {
    const { default: theme } = await import("@shikijs/themes/github-dark");
    return theme;
  },
  "github-light": async () => {
    const { default: theme } = await import("@shikijs/themes/github-light");
    return theme;
  },
  "vitesse-dark": async () => {
    const { default: theme } = await import("@shikijs/themes/vitesse-dark");
    return theme;
  },
  "vitesse-light": async () => {
    const { default: theme } = await import("@shikijs/themes/vitesse-light");
    return theme;
  },
} satisfies Record<ArticleCodeTheme, () => Promise<ThemeRegistration>>;

const highlighterPromises = new Map<
  string,
  ReturnType<typeof createHighlighterCore>
>();

const createArticleHighlighter = async (themes: ArticleCodeThemes) => {
  const registrations = await Promise.all([
    themeLoaders[themes.light](),
    themeLoaders[themes.dark](),
  ]);
  return await createHighlighterCore({
    engine: createOnigurumaEngine(import("shiki/wasm")),
    langAlias: languageAliases,
    langs: [
      bash,
      css,
      diff,
      html,
      javascript,
      jsx,
      json,
      markdown,
      mdx,
      typescript,
      tsx,
      yaml,
    ],
    themes: registrations,
  });
};

const getHighlighter = async (themes: ArticleCodeThemes) => {
  const key = `${themes.light}:${themes.dark}`;
  let highlighterPromise = highlighterPromises.get(key);
  if (highlighterPromise === undefined) {
    highlighterPromise = createArticleHighlighter(themes);
    highlighterPromises.set(key, highlighterPromise);
  }
  return await highlighterPromise;
};

const isCodePre = (node: Element): boolean => {
  const [firstChild] = node.children;
  return (
    node.tagName === "pre" &&
    firstChild?.type === "element" &&
    firstChild.tagName === "code"
  );
};

export default function articleCode(options: ArticleCodePluginOptions) {
  if (
    !isArticleCodeTheme(options.themes.light) ||
    !isArticleCodeTheme(options.themes.dark)
  ) {
    throw new Error(
      `[blog/code-theme] Unsupported Article code theme pair ${JSON.stringify(options.themes)}. Register both fine-grained themes inside the Blog wrapper before selecting them.`
    );
  }

  return async (root: Root): Promise<void> => {
    const originalProperties: Element["properties"][] = [];
    visit(root, "element", (node: Element) => {
      if (isCodePre(node)) {
        const [code] = node.children;
        if (code.type !== "element") {
          return;
        }
        const {
          className: _languageClass,
          metastring: _metadata,
          ...articleProperties
        } = code.properties;
        originalProperties.push({
          ...node.properties,
          ...articleProperties,
        });
      }
    });

    const highlighter = await getHighlighter(options.themes);
    const transform = rehypeShikiFromHighlighter(highlighter, {
      addLanguageClass: true,
      themes: {
        dark: options.themes.dark,
        light: options.themes.light,
      },
      transformers: [
        transformerNotationDiff({ matchAlgorithm: "v3" }),
        transformerNotationHighlight({ matchAlgorithm: "v3" }),
        transformerNotationWordHighlight({ matchAlgorithm: "v3" }),
        transformerNotationFocus({ matchAlgorithm: "v3" }),
        transformerTwoslash({
          explicitTrigger: /\btwoslash\b/u,
          langs: ["ts", "tsx", "typescript"],
          throws: true,
        }),
      ],
    });
    await Reflect.apply(transform, undefined, [root]);

    let index = 0;
    visit(root, "element", (node: Element) => {
      if (node.tagName !== "pre") {
        return;
      }
      const properties = originalProperties[index];
      if (properties !== undefined) {
        node.properties = {
          ...node.properties,
          ...properties,
        };
      }
      index += 1;
    });
  };
}
