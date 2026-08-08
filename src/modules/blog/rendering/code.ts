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
import { CONTINUE, SKIP, visit } from "unist-util-visit";

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
  rendererRich({ queryRendering: "line" })
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

/*
 * Shiki writes its classes as the raw `class` attribute rather than as hast's
 * `className`, and it writes a single class as a bare string and several as an
 * array. Both shapes and both names occur in one tree — the `pre` carries an
 * array under `class`, a Twoslash hover carries a string under the same key —
 * so a reader that assumes either one silently matches nothing.
 */
const hasClass = (node: Element, name: string): boolean => {
  const value = node.properties.class ?? node.properties.className;
  if (typeof value === "string") {
    return value.split(/\s+/u).includes(name);
  }
  return Array.isArray(value) && value.includes(name);
};

const srOnlyLabel = (text: string): Element => ({
  type: "element",
  tagName: "span",
  properties: { className: ["sr-only"], "data-code-annotation": "" },
  children: [{ type: "text", value: text }],
});

/*
 * Every annotation says its meaning in words as well as in colour.
 *
 * A highlighted line, an added line and a removed line differ by fill alone,
 * and a removed line differs from an added one by hue alone — which is the
 * exact shape of a colour-only distinction. The label is a visually hidden
 * span rather than an `aria-label`, because a `span` carries no role for a name
 * to attach to; `user-select: none` in the stylesheet keeps it out of a
 * selection, and the copy control never sees it at all, since `data-copy-source`
 * is compiled from the authored fence rather than read back off the DOM.
 */
const LINE_ANNOTATION_LABELS: readonly (readonly [string, string])[] = [
  ["highlighted", "Highlighted line: "],
  ["focused", "Focused line: "],
];

const labelAnnotatedLines = (root: Root): void => {
  visit(root, "element", (node: Element) => {
    if (hasClass(node, "highlighted-word")) {
      node.children = [
        srOnlyLabel("highlighted "),
        ...node.children,
        srOnlyLabel(" end highlight"),
      ];
      return SKIP;
    }

    if (!hasClass(node, "line")) {
      return CONTINUE;
    }

    if (hasClass(node, "diff")) {
      node.children = [
        srOnlyLabel(hasClass(node, "add") ? "Added line: " : "Removed line: "),
        ...node.children,
      ];
      return CONTINUE;
    }

    const label = LINE_ANNOTATION_LABELS.find(([className]) =>
      hasClass(node, className)
    );
    if (label !== undefined) {
      node.children = [srOnlyLabel(label[1]), ...node.children];
    }
    return CONTINUE;
  });
};

/*
 * Twoslash's hover markup becomes three named elements the Article registry can
 * map, so the popup can be a real Radix Popover instead of a CSS hover state.
 *
 * The split happens here, at compile time, and not in a client component that
 * reads `props.children`: across the server/client boundary a child is an
 * unresolved lazy reference during SSR and an element after hydration, so
 * routing children by inspection renders one tree on the server and another on
 * the client. That is the defect #50 exists to have removed, and the compiler is
 * the one place that can partition a tree without guessing at it.
 *
 * Class names are preserved rather than replaced: they are how the accepted
 * prototype still selects this markup, and #60 retires the prototypes.
 */
const liftTwoslashHovers = (root: Root): void => {
  visit(root, "element", (node: Element) => {
    if (!hasClass(node, "twoslash-hover")) {
      return CONTINUE;
    }

    const popup = node.children.find(
      (child): child is Element =>
        child.type === "element" && hasClass(child, "twoslash-popup-container")
    );
    if (popup === undefined) {
      return CONTINUE;
    }

    /*
     * A JSDoc example inside a hover popup arrives as a `pre`, and `pre` is a
     * global Article mapping — so without a mark it comes back out as a full
     * CodeBlock frame, complete with a surface, a ring and a copy control,
     * nested inside the popup's own frame.
     */
    visit(popup, "element", (inner: Element) => {
      if (inner.tagName === "pre") {
        inner.properties["data-twoslash-internal"] = "";
      }
    });

    popup.tagName = "twoslash-popup";
    node.tagName = "twoslash-hover";
    node.children = [
      popup,
      {
        type: "element",
        tagName: "twoslash-trigger",
        properties: { className: ["twoslash-trigger"] },
        children: node.children.filter((child) => child !== popup),
      },
    ];
    return SKIP;
  });
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
      defaultColor: false,
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

    /*
     * The compiled fence properties go back onto the highlighted `pre` by
     * position, so the walk has to count exactly the `pre` elements the walk
     * above counted. Twoslash's rich renderer can emit a `pre` of its own
     * inside a hover popup — a fenced example in a JSDoc comment — and every
     * such `pre` used to consume one entry, shifting the title, the copy source
     * and the line-number start of every later block by one.
     */
    let index = 0;
    visit(root, "element", (node: Element) => {
      if (node.tagName !== "pre") {
        return CONTINUE;
      }
      const properties = originalProperties[index];
      if (properties !== undefined) {
        node.properties = {
          ...node.properties,
          ...properties,
        };
      }
      index += 1;
      // Nothing inside a highlighted `pre` is an authored fence.
      return SKIP;
    });

    labelAnnotatedLines(root);
    liftTwoslashHovers(root);
  };
}
