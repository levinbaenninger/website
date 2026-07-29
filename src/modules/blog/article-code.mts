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
import githubDark from "@shikijs/themes/github-dark";
import githubLight from "@shikijs/themes/github-light";
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
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import { createTwoslasher } from "twoslash/core";
import ts from "typescript";
import { visit } from "unist-util-visit";

interface ArticleCodePluginOptions {
  readonly themes: {
    readonly dark: "github-dark";
    readonly light: "github-light";
  };
}

const languageAliases = {
  bash: "shellscript",
  js: "javascript",
  md: "markdown",
  ts: "typescript",
} as const;

const twoslasher = createTwoslasher({
  cache: true,
  compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX,
    lib: ["lib.es2022.d.ts"],
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    target: ts.ScriptTarget.ES2022,
  },
  fsMap: createDefaultMapFromNodeModules(
    {
      lib: ["lib.es2022.d.ts"],
      target: ts.ScriptTarget.ES2022,
    },
    ts
  ),
  fsCache: false,
  tsModule: ts,
  vfsRoot: "/blog-twoslash",
});
const transformerTwoslash = createTransformerFactory(
  twoslasher,
  rendererRich()
);

let highlighterPromise: ReturnType<typeof createHighlighterCore> | undefined;

const getHighlighter = async () => {
  highlighterPromise ??= createHighlighterCore({
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
    themes: [githubLight, githubDark],
  });
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
    options.themes.light !== "github-light" ||
    options.themes.dark !== "github-dark"
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

    const highlighter = await getHighlighter();
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
