import GithubSlugger from "github-slugger";
import type { Code, Definition, Heading, Root, RootContent } from "mdast";
import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";

import { serializeCodeTabLabels } from "./article-code-tabs-contract.mts";
import type {
  ArticleCompilationFacts,
  ArticleHeadingFact,
  ArticleLinkFact,
} from "./article-facts.ts";

interface ArticlePosition {
  readonly start: {
    readonly line: number;
    readonly column: number;
  };
}

interface ArticleFile {
  readonly path: string;
  readonly message: (
    reason: string,
    options: {
      readonly place?: ArticlePosition;
      readonly ruleId: string;
      readonly source: "blog";
    }
  ) => ArticleDiagnostic;
}

interface ArticleDiagnostic extends Error {
  readonly column?: number;
  readonly line?: number;
  readonly ruleId?: string;
}

class ArticleDiagnostics {
  readonly #diagnostics: ArticleDiagnostic[] = [];
  readonly #file: ArticleFile;
  readonly #slug: string;

  constructor(file: ArticleFile) {
    this.#file = file;
    this.#slug = file.path.split(/[\\/]/u).at(-2) ?? "unknown";
  }

  capture(
    node: { readonly position?: ArticlePosition },
    action: () => void
  ): boolean {
    try {
      action();
      return true;
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      const matchedRule = /^\[blog\/[^\]]+\]\s*/u.exec(error.message);
      const ruleId =
        matchedRule?.[0].trim().slice(1, -1) ?? "blog/article-contract";
      const reason = error.message.replace(/^\[blog\/[^\]]+\]\s*/u, "");
      this.#diagnostics.push(
        this.#file.message(`Article ${JSON.stringify(this.#slug)}: ${reason}`, {
          place: node.position,
          ruleId,
          source: "blog",
        })
      );
      return false;
    }
  }

  throwIfAny(): void {
    if (this.#diagnostics.length > 0) {
      const sorted = this.#diagnostics.toSorted((left, right) => {
        const positionOrder =
          (left.line ?? 0) - (right.line ?? 0) ||
          (left.column ?? 0) - (right.column ?? 0);
        if (positionOrder !== 0) {
          return positionOrder;
        }
        const leftRule = left.ruleId ?? "";
        const rightRule = right.ruleId ?? "";
        if (leftRule === rightRule) {
          return 0;
        }
        return leftRule < rightRule ? -1 : 1;
      });
      throw new Error(
        `Article compilation failed with ${sorted.length} contract violation${sorted.length === 1 ? "" : "s"}:\n${sorted.map((diagnostic) => `${diagnostic.name} [${diagnostic.ruleId ?? "blog/article-contract"}]: ${diagnostic.message}`).join("\n")}`
      );
    }
  }
}

const normalizeSearchText = (value: string): string =>
  value.replaceAll(/\s+/gu, " ").trim();

const ASSET_IMPORT_PATTERN =
  /^import\s+[A-Za-z_$][\w$]*\s+from\s+["']\.\/assets\/[^"'?#]+["'];?\s*$/u;
const SUPPORTED_ASSET_PATTERN =
  /^\.\/assets\/[a-z0-9]+(?:[/-][a-z0-9]+)*(?:\.avif|\.jpeg|\.jpg|\.png|\.svg|\.webp)$/u;

const inlineNodeTypes = new Set([
  "delete",
  "emphasis",
  "link",
  "linkReference",
  "paragraph",
  "strong",
]);

const searchableText = (node: Root | Root["children"][number]): string => {
  if (node.type === "text" || node.type === "inlineCode") {
    return node.value;
  }

  if (
    node.type === "code" ||
    node.type === "definition" ||
    node.type === "image" ||
    node.type === "imageReference" ||
    node.type === "thematicBreak" ||
    node.type === "yaml"
  ) {
    return "";
  }

  if ("children" in node && Array.isArray(node.children)) {
    const separator = inlineNodeTypes.has(node.type) ? "" : " ";
    return node.children.map(searchableText).join(separator);
  }

  return "";
};

const collectSearchText = (root: Root): string =>
  normalizeSearchText(searchableText(root));

const CODE_LANGUAGES = new Set([
  "bash",
  "css",
  "diff",
  "html",
  "js",
  "json",
  "jsx",
  "md",
  "mdx",
  "text",
  "ts",
  "tsx",
  "yaml",
]);
const CODE_TEXT_PATTERN = /^[^\r\n]+$/u;
const CODE_TAB_GROUP_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const CODE_ANNOTATION_PATTERN =
  /\[!code (?:(?:\+\+|--|focus|highlight)(?::[1-9]\d*)?|word:(?:\\.|[^:\]])+(?::[1-9]\d*)?)\]/gu;
const CODE_ANNOTATION_CANDIDATE_PATTERN = /\[!code[^\]]*(?:\]|$)/gu;
const TWOSLASH_IMPORT_PATTERN =
  /^\s*(?:import|export)\s+(?:[^"']*\s+from\s+)?["']([^"']+)["']/gmu;
const TWOSLASH_DYNAMIC_IMPORT_PATTERN =
  /\b(?:import|require)\(\s*["']([^"']+)["']\s*\)/gu;
const TWOSLASH_DIRECTIVE_PATTERN = /^\s*\/\/\s*@([A-Za-z][\w-]*)/gmu;
const TWOSLASH_DIRECTIVE_NAMES = ["errors", "ts-expect-error"] as const;
const ALLOWED_TWOSLASH_DIRECTIVES = new Set<string>(TWOSLASH_DIRECTIVE_NAMES);
const TWOSLASH_COPY_DIRECTIVE_PATTERN = new RegExp(
  String.raw`^\s*\/\/\s*(?:\^+\??|@(?:${TWOSLASH_DIRECTIVE_NAMES.join("|")})\b)`,
  "u"
);

interface CodeFenceMetadata {
  readonly lineNumbers?: number;
  readonly tab?: string;
  readonly tabGroup?: string;
  readonly title?: string;
  readonly twoslash: boolean;
}

const readMetadataValue = (
  metadata: string,
  start: number
): { readonly end: number; readonly value: string } => {
  if (metadata[start] === '"') {
    const end = metadata.indexOf('"', start + 1);
    if (end === -1) {
      throw new Error(
        `[blog/code-meta] Fence metadata ${JSON.stringify(metadata)} contains an unterminated quoted value. Close the double quote.`
      );
    }
    return {
      end: end + 1,
      value: metadata.slice(start + 1, end),
    };
  }

  const matched = /^[^\s]+/u.exec(metadata.slice(start));
  if (matched === null) {
    throw new Error(
      `[blog/code-meta] Fence metadata ${JSON.stringify(metadata)} is missing a value after "=".`
    );
  }
  return {
    end: start + matched[0].length,
    value: matched[0],
  };
};

const validateCodeText = (
  key: "tab" | "title",
  value: string,
  maximum: number
): void => {
  if (
    !CODE_TEXT_PATTERN.test(value) ||
    value !== value.trim() ||
    !value.isWellFormed() ||
    value.normalize("NFC") !== value ||
    [
      ...new Intl.Segmenter(undefined, {
        granularity: "grapheme",
      }).segment(value),
    ].length > maximum
  ) {
    throw new Error(
      `[blog/code-${key}] Code ${key} ${JSON.stringify(value)} must be trimmed, single-line NFC text of 1–${maximum} characters.`
    );
  }
};

const parseCodeMetadata = (metadata: string): CodeFenceMetadata => {
  const values = new Map<string, string | true>();
  let index = 0;
  while (index < metadata.length) {
    while (metadata[index] === " ") {
      index += 1;
    }
    if (index === metadata.length) {
      break;
    }

    const keyMatch = /^[A-Za-z][A-Za-z-]*/u.exec(metadata.slice(index));
    if (keyMatch === null) {
      throw new Error(
        `[blog/code-meta] Fence metadata ${JSON.stringify(metadata)} is malformed. Use only the approved keys and literal values.`
      );
    }
    const [key] = keyMatch;
    index += key.length;
    let value: string | true = true;
    if (metadata[index] === "=") {
      const parsed = readMetadataValue(metadata, index + 1);
      ({ end: index, value } = parsed);
    }
    if (index < metadata.length && metadata[index] !== " ") {
      throw new Error(
        `[blog/code-meta] Fence metadata ${JSON.stringify(metadata)} is malformed near ${JSON.stringify(metadata.slice(index))}. Separate keys with spaces.`
      );
    }
    if (values.has(key)) {
      throw new Error(
        `[blog/code-meta] Fence metadata key ${JSON.stringify(key)} appears more than once. Keep one value.`
      );
    }
    values.set(key, value);
  }

  for (const key of values.keys()) {
    if (
      key !== "lineNumbers" &&
      key !== "tab" &&
      key !== "tab-group" &&
      key !== "title" &&
      key !== "twoslash"
    ) {
      throw new Error(
        `[blog/code-meta] Unknown fence metadata key ${JSON.stringify(key)}. Use title, lineNumbers, tab, tab-group, or twoslash.`
      );
    }
  }

  const title = values.get("title");
  if (title !== undefined && typeof title !== "string") {
    throw new Error(
      '[blog/code-title] Code title requires a quoted value such as title="Example".'
    );
  }
  if (typeof title === "string") {
    validateCodeText("title", title, 120);
  }

  const tab = values.get("tab");
  if (tab !== undefined && typeof tab !== "string") {
    throw new Error(
      '[blog/code-tab] Code tab requires a quoted value such as tab="TypeScript".'
    );
  }
  if (typeof tab === "string") {
    validateCodeText("tab", tab, 40);
  }

  const tabGroup = values.get("tab-group");
  if (
    tabGroup !== undefined &&
    (typeof tabGroup !== "string" ||
      tabGroup.length > 80 ||
      !CODE_TAB_GROUP_PATTERN.test(tabGroup))
  ) {
    throw new Error(
      `[blog/code-tabs-group] Code tab-group ${JSON.stringify(tabGroup)} must be a lowercase kebab-case ID of 1–80 characters.`
    );
  }

  const rawLineNumbers = values.get("lineNumbers");
  let lineNumbers: number | undefined;
  if (rawLineNumbers !== undefined) {
    if (rawLineNumbers === true) {
      lineNumbers = 1;
    } else if (/^[1-9]\d*$/u.test(rawLineNumbers)) {
      lineNumbers = Number(rawLineNumbers);
      if (!Number.isSafeInteger(lineNumbers)) {
        throw new TypeError(
          `[blog/code-line-numbers] Code lineNumbers start ${JSON.stringify(rawLineNumbers)} exceeds the safe integer range.`
        );
      }
    } else {
      throw new Error(
        `[blog/code-line-numbers] Code lineNumbers start ${JSON.stringify(rawLineNumbers)} must be a positive integer.`
      );
    }
  }

  const rawTwoslash = values.get("twoslash");
  if (rawTwoslash !== undefined && rawTwoslash !== true) {
    throw new Error(
      "[blog/code-meta] twoslash is a bare flag and does not accept a value."
    );
  }

  return {
    lineNumbers,
    tab: typeof tab === "string" ? tab : undefined,
    tabGroup: typeof tabGroup === "string" ? tabGroup : undefined,
    title: typeof title === "string" ? title : undefined,
    twoslash: rawTwoslash === true,
  };
};

const cleanCopySource = (source: string): string => {
  const lines = source.split("\n");
  const cleaned = lines.flatMap((line) => {
    if (TWOSLASH_COPY_DIRECTIVE_PATTERN.test(line)) {
      return [];
    }
    const withoutAnnotation = line.replace(
      /\s*(?:\/\/|\/\*|<!--|#)\s*\[!code[^\]]+\]\s*(?:\*\/|-->)?\s*$/u,
      ""
    );
    return [withoutAnnotation === line ? line : withoutAnnotation.trimEnd()];
  });
  return cleaned.join("\n");
};

const validateCodeAnnotations = (node: Code): void => {
  const candidates = node.value.match(CODE_ANNOTATION_CANDIDATE_PATTERN) ?? [];
  const valid = node.value.match(CODE_ANNOTATION_PATTERN) ?? [];
  if (
    candidates.length !== valid.length ||
    candidates.some((candidate, index) => candidate !== valid[index])
  ) {
    throw new Error(
      "[blog/code-annotation] Code contains a malformed or unsupported [!code ...] annotation. Use ++, --, highlight, focus, or word:<text>."
    );
  }
};

const validateTwoslashSource = (node: Code): void => {
  for (const pattern of [
    TWOSLASH_IMPORT_PATTERN,
    TWOSLASH_DYNAMIC_IMPORT_PATTERN,
  ]) {
    pattern.lastIndex = 0;
    for (const matched of node.value.matchAll(pattern)) {
      const [, specifier] = matched;
      throw new Error(
        `[blog/twoslash-import] Twoslash import ${JSON.stringify(specifier)} is outside the isolated type allowlist. Use pinned TypeScript library declarations only.`
      );
    }
  }

  TWOSLASH_DIRECTIVE_PATTERN.lastIndex = 0;
  for (const matched of node.value.matchAll(TWOSLASH_DIRECTIVE_PATTERN)) {
    const [, directive] = matched;
    if (
      directive !== undefined &&
      !ALLOWED_TWOSLASH_DIRECTIVES.has(directive)
    ) {
      throw new Error(
        `[blog/twoslash-directive] Twoslash directive ${JSON.stringify(directive)} is not approved. Use only explicit expected-error directives.`
      );
    }
  }
};

const annotateCodeNode = (
  node: Code,
  diagnostics: ArticleDiagnostics
): CodeFenceMetadata | undefined => {
  let parsed: CodeFenceMetadata | undefined;
  diagnostics.capture(node, () => {
    const language = node.lang ?? "text";
    if (!CODE_LANGUAGES.has(language)) {
      throw new Error(
        `[blog/code-language] Code language ${JSON.stringify(language)} is not approved. Use text, bash, css, html, js, jsx, json, md, mdx, ts, tsx, yaml, or diff.`
      );
    }
    parsed = parseCodeMetadata(node.meta ?? "");
    validateCodeAnnotations(node);
    if (parsed.twoslash && language !== "ts" && language !== "tsx") {
      throw new Error(
        `[blog/code-twoslash-language] Twoslash requires ts or tsx, not ${JSON.stringify(language)}.`
      );
    }
    if (parsed.twoslash) {
      validateTwoslashSource(node);
    }
    if (parsed.tabGroup !== undefined && parsed.tab === undefined) {
      throw new Error(
        "[blog/code-tabs-group] tab-group requires a tab label on the same first fence."
      );
    }

    node.data ??= {};
    node.data.hProperties = {
      ...node.data.hProperties,
      "data-code-title": parsed.title,
      "data-code-tab-label": parsed.tab,
      "data-copy-source": cleanCopySource(node.value),
      "data-line-numbers-start": parsed.lineNumbers,
      "data-twoslash": parsed.twoslash ? "" : undefined,
    };
  });
  return parsed;
};

const codeTabsNode = (
  children: readonly Code[],
  labels: readonly string[],
  groupId: string | undefined
): RootContent =>
  ({
    type: "mdxJsxFlowElement",
    name: "CodeTabs",
    attributes: [
      {
        type: "mdxJsxAttribute",
        name: "labels",
        value: serializeCodeTabLabels(labels),
      },
      ...(groupId === undefined
        ? []
        : [
            {
              type: "mdxJsxAttribute" as const,
              name: "groupId",
              value: groupId,
            },
          ]),
    ],
    children,
  }) as RootContent;

const validateAndGroupCode = (
  root: Root,
  diagnostics: ArticleDiagnostics
): void => {
  const metadata = new Map<Code, CodeFenceMetadata>();
  visit(root, "code", (node: Code) => {
    const parsed = annotateCodeNode(node, diagnostics);
    if (parsed !== undefined) {
      metadata.set(node, parsed);
    }
  });

  const grouped: RootContent[] = [];
  for (let index = 0; index < root.children.length; ) {
    const child = root.children[index];
    if (child.type !== "code") {
      grouped.push(child);
      index += 1;
      continue;
    }

    const run: Code[] = [];
    while (root.children[index]?.type === "code") {
      run.push(root.children[index] as Code);
      index += 1;
    }
    const runMetadata = run.map((node) => metadata.get(node));
    const tabbedCount = runMetadata.filter(
      (entry) => entry?.tab !== undefined
    ).length;
    if (tabbedCount === 0) {
      grouped.push(...run);
      continue;
    }
    if (tabbedCount !== run.length) {
      diagnostics.capture(run[0], () => {
        throw new Error(
          "[blog/code-tabs-boundary] Consecutive code fences cannot mix tabbed and independent blocks. Add tab labels to the complete run or separate it with content."
        );
      });
      grouped.push(...run);
      continue;
    }
    if (run.length < 2) {
      diagnostics.capture(run[0], () => {
        throw new Error(
          "[blog/code-tabs-size] A tabbed code fence must be immediately followed by at least one more tabbed fence."
        );
      });
      grouped.push(...run);
      continue;
    }

    const labels = runMetadata.map((entry) => entry?.tab ?? "");
    if (new Set(labels).size !== labels.length) {
      diagnostics.capture(run[0], () => {
        throw new Error(
          "[blog/code-tabs-label] Code tab labels must be unique within their consecutive group."
        );
      });
    }
    const laterGroup = runMetadata
      .slice(1)
      .find((entry) => entry?.tabGroup !== undefined);
    if (laterGroup !== undefined) {
      diagnostics.capture(run[1], () => {
        throw new Error(
          "[blog/code-tabs-group] tab-group may appear only on the first fence in a CodeTabs group."
        );
      });
    }
    grouped.push(codeTabsNode(run, labels, runMetadata[0]?.tabGroup));
  }
  root.children = grouped;
};

const factsExport = (
  facts: ArticleCompilationFacts
): Root["children"][number] => {
  const serialized = JSON.stringify(facts);
  const value = `export const __articleFacts = JSON.parse(${JSON.stringify(serialized)})`;

  return {
    type: "mdxjsEsm",
    value,
    data: {
      estree: {
        type: "Program",
        sourceType: "module",
        body: [
          {
            type: "ExportNamedDeclaration",
            attributes: [],
            specifiers: [],
            declaration: {
              type: "VariableDeclaration",
              kind: "const",
              declarations: [
                {
                  type: "VariableDeclarator",
                  id: {
                    type: "Identifier",
                    name: "__articleFacts",
                  },
                  init: {
                    type: "CallExpression",
                    optional: false,
                    callee: {
                      type: "MemberExpression",
                      computed: false,
                      optional: false,
                      object: {
                        type: "Identifier",
                        name: "JSON",
                      },
                      property: {
                        type: "Identifier",
                        name: "parse",
                      },
                    },
                    arguments: [
                      {
                        type: "Literal",
                        value: serialized,
                        raw: JSON.stringify(serialized),
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  };
};

const assignHeadingIds = (
  root: Root,
  diagnostics: ArticleDiagnostics
): readonly ArticleHeadingFact[] => {
  const headings: ArticleHeadingFact[] = [];
  const slugger = new GithubSlugger();

  visit(root, "heading", (heading: Heading) => {
    diagnostics.capture(heading, () => {
      if (heading.depth === 1) {
        throw new Error(
          "[blog/heading-h1] Article bodies begin at h2; the Article title supplies the only h1. Use h2–h6."
        );
      }

      const text = toString(heading);
      const id = slugger.slug(text);
      heading.data ??= {};
      heading.data.hProperties = {
        ...heading.data.hProperties,
        id,
      };
      headings.push({
        depth: heading.depth,
        id,
        text,
      });
    });
  });

  return headings;
};

const collectAssetImports = (
  root: Root,
  diagnostics: ArticleDiagnostics
): ReadonlyMap<string, string> => {
  const imports = new Map<string, string>();
  const importedSpecifiers = new Set<string>();

  visit(root, "mdxjsEsm", (node) => {
    diagnostics.capture(node, () => {
      if (node.value === "") {
        return;
      }

      const match = ASSET_IMPORT_PATTERN.exec(node.value);
      if (match === null) {
        const ruleId = node.value.trimStart().startsWith("import")
          ? "blog/import"
          : "blog/export";
        throw new Error(
          `[${ruleId}] Article-authored modules are limited to default local image imports. Use a default import from "./assets/...".`
        );
      }

      const normalizedImport = node.value.trim().replace(/;$/u, "");
      const fromIndex = normalizedImport.indexOf(" from ");
      const localName = normalizedImport
        .slice("import ".length, fromIndex)
        .trim();
      const quotedSpecifier = normalizedImport.slice(
        fromIndex + " from ".length
      );
      const specifier = quotedSpecifier.slice(1, -1);
      if (!SUPPORTED_ASSET_PATTERN.test(specifier)) {
        throw new Error(
          `[blog/import] ${JSON.stringify(specifier)} is not an approved Article-local still-image import. Use AVIF, WebP, PNG, JPEG, or SVG.`
        );
      }
      if (imports.has(localName) || importedSpecifiers.has(specifier)) {
        throw new Error(
          `[blog/import-duplicate] ${JSON.stringify(specifier)} is imported more than once. Reuse one binding.`
        );
      }

      imports.set(localName, specifier);
      importedSpecifiers.add(specifier);
    });
  });

  return imports;
};

const captionNodeTypes = new Set([
  "emphasis",
  "inlineCode",
  "link",
  "paragraph",
  "strong",
  "text",
]);

const validateFigureCaption = (
  root: Root,
  diagnostics: ArticleDiagnostics
): void => {
  visit(root, (node) => {
    if (node.type !== "root" && !captionNodeTypes.has(node.type)) {
      diagnostics.capture(node, () => {
        throw new Error(
          `[blog/figure-caption] ${JSON.stringify(node.type)} is not inline Figure caption content. Use only text, emphasis, strong text, inline code, and links.`
        );
      });
    }
  });
};

type FigureNode = Extract<
  Root["children"][number],
  { readonly type: "mdxJsxFlowElement" | "mdxJsxTextElement" }
>;

const validateFigure = (
  node: FigureNode,
  imports: ReadonlyMap<string, string>,
  consumedImports: Set<string>,
  diagnostics: ArticleDiagnostics
): void => {
  if (node.type === "mdxJsxTextElement") {
    diagnostics.capture(node, () => {
      throw new Error(
        '[blog/figure-position] "Figure" is inline, but Figure is a body-level element. Move it outside the paragraph.'
      );
    });
    return;
  }

  let alternativeCount = 0;
  let sourceName: string | undefined;
  const seenAttributes = new Set<string>();

  for (const attribute of node.attributes) {
    diagnostics.capture(attribute, () => {
      if (
        attribute.type !== "mdxJsxAttribute" ||
        typeof attribute.name !== "string"
      ) {
        throw new Error(
          "[blog/figure-prop] Figure received a spread or expression attribute. Use only src, alt, or decorative."
        );
      }
      if (
        attribute.name !== "src" &&
        attribute.name !== "alt" &&
        attribute.name !== "decorative"
      ) {
        throw new Error(
          `[blog/figure-prop] Figure does not accept ${JSON.stringify(attribute.name)}. Use only src, alt, or decorative.`
        );
      }
      if (seenAttributes.has(attribute.name)) {
        throw new Error(
          `[blog/figure-prop] Figure prop ${JSON.stringify(attribute.name)} appears more than once. Keep one value.`
        );
      }
      seenAttributes.add(attribute.name);

      if (attribute.name === "src") {
        if (
          attribute.value === null ||
          attribute.value === undefined ||
          typeof attribute.value === "string" ||
          attribute.value.value === "" ||
          !/^[A-Za-z_$][\w$]*$/u.test(attribute.value.value)
        ) {
          throw new Error(
            `[blog/figure-source] Figure src ${JSON.stringify(attribute.value)} is not an imported image binding. Pass an Article-local import identifier.`
          );
        }
        sourceName = attribute.value.value;
        return;
      }

      if (attribute.name === "alt") {
        if (
          typeof attribute.value !== "string" ||
          attribute.value.length === 0 ||
          attribute.value !== attribute.value.trim() ||
          !attribute.value.isWellFormed() ||
          attribute.value.normalize("NFC") !== attribute.value ||
          [
            ...new Intl.Segmenter(undefined, {
              granularity: "grapheme",
            }).segment(attribute.value),
          ].length > 500
        ) {
          throw new Error(
            `[blog/figure-alt] Figure alt ${JSON.stringify(attribute.value)} is invalid. Use informative, trimmed NFC text of 1–500 characters.`
          );
        }
        alternativeCount += 1;
        return;
      }

      if (attribute.value !== null) {
        throw new Error(
          `[blog/figure-alternative] Figure decorative received ${JSON.stringify(attribute.value)}. Declare decorative as a bare boolean prop.`
        );
      }
      alternativeCount += 1;
    });
  }

  diagnostics.capture(node, () => {
    if (alternativeCount !== 1) {
      throw new Error(
        `[blog/figure-alternative] Figure has ${alternativeCount} valid alternatives. Provide exactly one informative alt or decorative declaration.`
      );
    }
  });
  const validSource = diagnostics.capture(node, () => {
    if (sourceName === undefined || !imports.has(sourceName)) {
      throw new Error(
        `[blog/figure-source] Figure src ${JSON.stringify(sourceName)} is not an imported Article-local image. Pass one imported image binding.`
      );
    }
  });

  if (validSource && sourceName !== undefined) {
    consumedImports.add(sourceName);
  }
  validateFigureCaption(
    {
      type: "root",
      children: node.children,
    },
    diagnostics
  );
};

const validateClosedLanguage = (
  root: Root,
  imports: ReadonlyMap<string, string>,
  diagnostics: ArticleDiagnostics
): void => {
  const consumedImports = new Set<string>();

  visit(root, (node) => {
    diagnostics.capture(node, () => {
      if (node.type === "html") {
        throw new Error(
          "[blog/raw-html] Raw HTML is outside the closed Article language. Use approved Markdown."
        );
      }
      if (
        node.type === "mdxFlowExpression" ||
        node.type === "mdxTextExpression"
      ) {
        throw new Error(
          "[blog/expression] Arbitrary JavaScript expressions are outside the closed Article language. Use literal Markdown."
        );
      }
      if (
        node.type === "mdxJsxFlowElement" ||
        node.type === "mdxJsxTextElement"
      ) {
        if (node.name !== "Figure") {
          const ruleId =
            typeof node.name === "string" &&
            node.name === node.name.toLowerCase()
              ? "blog/raw-html"
              : "blog/element";
          throw new Error(
            `[${ruleId}] ${JSON.stringify(node.name)} is not an approved Article element. Use Figure or approved Markdown.`
          );
        }
        validateFigure(node, imports, consumedImports, diagnostics);
        return;
      }
      if (node.type === "image" || node.type === "imageReference") {
        throw new Error(
          "[blog/image] Figure is the only supported body-image primitive. Import the image and render Figure."
        );
      }
      if (
        node.type === "footnoteDefinition" ||
        node.type === "footnoteReference"
      ) {
        throw new Error(
          "[blog/footnote] Footnotes are outside the closed Article language. Use ordinary prose."
        );
      }
      if (
        node.type === "text" &&
        (!node.value.isWellFormed() ||
          node.value.normalize("NFC") !== node.value)
      ) {
        throw new Error(
          `[blog/text-normalization] ${JSON.stringify(node.value)} is not NFC-normalized Article prose. Normalize the authored text to NFC.`
        );
      }
    });
  });

  for (const localName of imports.keys()) {
    if (!consumedImports.has(localName)) {
      diagnostics.capture(root, () => {
        throw new Error(
          `[blog/import-unused] Imported Article asset ${JSON.stringify(localName)} is not consumed by a Figure. Add a Figure or remove the import.`
        );
      });
    }
  }
};

const validateHref = (href: string, headingIds: ReadonlySet<string>): void => {
  if (!href.startsWith("https://") && href.includes("?")) {
    throw new Error(
      `[blog/link-query] Internal link ${JSON.stringify(href)} contains a query string. Remove the query.`
    );
  }
  if (href.startsWith("#")) {
    const fragment = href.slice(1);
    if (fragment.length === 0 || !headingIds.has(fragment)) {
      throw new Error(
        `[blog/link-fragment] Same-Article fragment ${JSON.stringify(fragment)} does not match a heading.`
      );
    }
    return;
  }
  if (href.startsWith("/")) {
    if (href.startsWith("//")) {
      throw new Error(
        `[blog/link-internal] Protocol-relative link ${JSON.stringify(href)} is not internal. Use a root-relative path or absolute HTTPS URL.`
      );
    }
    return;
  }
  if (href.startsWith("https://")) {
    if (!URL.canParse(href)) {
      throw new Error(
        `[blog/link-external] ${JSON.stringify(href)} is not a valid absolute HTTPS URL.`
      );
    }
    return;
  }
  if (/^[a-z][a-z0-9+.-]*:/iu.test(href)) {
    throw new Error(
      `[blog/link-scheme] ${JSON.stringify(href)} does not use the required HTTPS scheme.`
    );
  }
  throw new Error(
    `[blog/link-relative] ${JSON.stringify(href)} is not an approved root-relative Article link.`
  );
};

const validateLinks = (
  root: Root,
  headings: readonly ArticleHeadingFact[],
  diagnostics: ArticleDiagnostics
): readonly ArticleLinkFact[] => {
  const definitions = new Map<string, string>();
  visit(root, "definition", (definition: Definition) => {
    definitions.set(definition.identifier, definition.url);
  });

  const headingIds = new Set(headings.map(({ id }) => id));
  const links: ArticleLinkFact[] = [];
  visit(root, (node) => {
    diagnostics.capture(node, () => {
      let href: string | undefined;
      if (node.type === "link") {
        href = node.url;
      } else if (node.type === "linkReference") {
        href = definitions.get(node.identifier);
        if (href === undefined) {
          throw new Error(
            `[blog/link-reference] Link reference ${JSON.stringify(node.identifier)} has no definition. Add its definition.`
          );
        }
      }

      if (href !== undefined) {
        validateHref(href, headingIds);
        links.push({ href });
      }
    });
  });

  return links;
};

export default function articleContract() {
  return (root: Root, file: ArticleFile): void => {
    const diagnostics = new ArticleDiagnostics(file);
    const imports = collectAssetImports(root, diagnostics);
    validateClosedLanguage(root, imports, diagnostics);
    validateAndGroupCode(root, diagnostics);
    const headings = assignHeadingIds(root, diagnostics);
    const facts: ArticleCompilationFacts = {
      headings,
      links: validateLinks(root, headings, diagnostics),
      searchText: collectSearchText(root),
    };

    diagnostics.throwIfAny();
    root.children.push(factsExport(facts));
  };
}
