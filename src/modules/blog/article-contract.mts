import GithubSlugger from "github-slugger";
import { icons as lucideIcons } from "lucide-react";
import type { Code, Definition, Heading, Root } from "mdast";
import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";

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
const LUCIDE_IMPORT_PATTERN =
  /^import\s*\{\s*[A-Za-z_$][\w$]*(?:\s*,\s*[A-Za-z_$][\w$]*)*\s*\}\s*from\s*["']lucide-react["'];?\s*$/u;
const LUCIDE_ICON_NAME_PATTERN = /^[A-Z][A-Za-z0-9]*Icon$/u;
const approvedLucideIconNames = new Set(
  Object.keys(lucideIcons).map((name) => `${name}Icon`)
);

type ArticleNode = Root | Root["children"][number];
type ArticleElement = Extract<
  Root["children"][number],
  { readonly type: "mdxJsxFlowElement" | "mdxJsxTextElement" }
>;
type ArticleFlowElement = Extract<
  Root["children"][number],
  { readonly type: "mdxJsxFlowElement" }
>;
type ArticleAttribute = ArticleElement["attributes"][number];

interface ArticleImports {
  readonly assets: ReadonlyMap<string, string>;
  readonly icons: ReadonlySet<string>;
}

interface CompositionSearchContract {
  readonly joinsInline?: boolean;
  readonly label?: "name" | "title";
}

const compositionSearchContracts = new Map<string, CompositionSearchContract>([
  ["Callout", { label: "title" }],
  ["Card", { label: "title" }],
  ["Cards", {}],
  ["Figure", {}],
  ["File", { label: "name" }],
  ["Files", {}],
  ["Folder", { label: "name" }],
  ["Kbd", { joinsInline: true }],
  ["Step", { joinsInline: true, label: "title" }],
  ["Steps", {}],
]);
const articleElementNames = new Set(compositionSearchContracts.keys());

const inlineNodeTypes = new Set([
  "delete",
  "emphasis",
  "link",
  "linkReference",
  "paragraph",
  "strong",
]);

const findStringAttribute = (
  node: ArticleElement,
  name: string
): string | undefined => {
  const attribute = node.attributes.find(
    (candidate) =>
      candidate.type === "mdxJsxAttribute" && candidate.name === name
  );
  return attribute?.type === "mdxJsxAttribute" &&
    typeof attribute.value === "string"
    ? attribute.value
    : undefined;
};

const visibleLabel = (node: ArticleElement): string => {
  const labelAttribute = compositionSearchContracts.get(node.name ?? "")?.label;
  return labelAttribute === undefined
    ? ""
    : (findStringAttribute(node, labelAttribute) ?? "");
};

const searchableText = (node: ArticleNode): string => {
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
    const separator =
      inlineNodeTypes.has(node.type) ||
      ((node.type === "mdxJsxFlowElement" ||
        node.type === "mdxJsxTextElement") &&
        compositionSearchContracts.get(node.name ?? "")?.joinsInline === true)
        ? ""
        : " ";
    const children = node.children.map(searchableText).join(separator);
    if (
      node.type === "mdxJsxFlowElement" ||
      node.type === "mdxJsxTextElement"
    ) {
      return [visibleLabel(node), children].filter(Boolean).join(" ");
    }
    return children;
  }

  return "";
};

const collectSearchText = (root: Root): string =>
  normalizeSearchText(searchableText(root));

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

const collectImports = (
  root: Root,
  diagnostics: ArticleDiagnostics
): ArticleImports => {
  const assets = new Map<string, string>();
  const icons = new Set<string>();
  const importedSpecifiers = new Set<string>();

  visit(root, "mdxjsEsm", (node) => {
    diagnostics.capture(node, () => {
      if (node.value === "") {
        return;
      }

      const assetMatch = ASSET_IMPORT_PATTERN.exec(node.value);
      if (assetMatch === null) {
        const lucideMatch = LUCIDE_IMPORT_PATTERN.exec(node.value);
        if (lucideMatch !== null) {
          const openBrace = node.value.indexOf("{");
          const closeBrace = node.value.indexOf("}");
          const importedNames = node.value.slice(openBrace + 1, closeBrace);
          for (const iconName of importedNames.trim().split(/\s*,\s*/u)) {
            if (!LUCIDE_ICON_NAME_PATTERN.test(iconName)) {
              throw new Error(
                `[blog/icon-import] ${JSON.stringify(iconName)} is not an approved Lucide icon import. Import an unaliased PascalCase name ending in Icon.`
              );
            }
            if (!approvedLucideIconNames.has(iconName)) {
              throw new Error(
                `[blog/icon-import] ${JSON.stringify(iconName)} is not exported by the approved Lucide icon registry.`
              );
            }
            if (icons.has(iconName)) {
              throw new Error(
                `[blog/import-duplicate] Lucide icon ${JSON.stringify(iconName)} is imported more than once. Keep one named import.`
              );
            }
            icons.add(iconName);
          }
          return;
        }

        const isLucideImport =
          node.value.includes('"lucide-react"') ||
          node.value.includes("'lucide-react'");
        let ruleId = "blog/export";
        if (isLucideImport) {
          ruleId = "blog/icon-import";
        } else if (node.value.trimStart().startsWith("import")) {
          ruleId = "blog/import";
        }
        throw new Error(
          isLucideImport
            ? `[${ruleId}] Lucide imports must be unaliased named icon imports such as import { RocketIcon } from "lucide-react".`
            : `[${ruleId}] Article-authored modules are limited to default local image imports and approved named Lucide icons.`
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
      if (assets.has(localName) || importedSpecifiers.has(specifier)) {
        throw new Error(
          `[blog/import-duplicate] ${JSON.stringify(specifier)} is imported more than once. Reuse one binding.`
        );
      }

      assets.set(localName, specifier);
      importedSpecifiers.add(specifier);
    });
  });

  return { assets, icons };
};

const textLength = (value: string): number =>
  [
    ...new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    }).segment(value),
  ].length;

const isValidLabel = (value: string, maximum: number): boolean =>
  value.length > 0 &&
  value === value.trim() &&
  !/[\r\n]/u.test(value) &&
  value.isWellFormed() &&
  value.normalize("NFC") === value &&
  textLength(value) <= maximum;

const isElement = (
  node: ArticleNode | undefined,
  name?: string
): node is ArticleElement =>
  node !== undefined &&
  (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") &&
  (name === undefined || node.name === name);

const isNamedElement = (
  node: ArticleNode,
  names: ReadonlySet<string>
): node is ArticleElement => isElement(node) && names.has(node.name ?? "");

const validateAllowedAttributes = (
  node: ArticleElement,
  allowed: ReadonlySet<string>,
  ruleId: string,
  diagnostics: ArticleDiagnostics
): ReadonlyMap<string, ArticleAttribute> => {
  const attributes = new Map<string, ArticleAttribute>();

  for (const attribute of node.attributes) {
    diagnostics.capture(attribute, () => {
      if (
        attribute.type !== "mdxJsxAttribute" ||
        typeof attribute.name !== "string"
      ) {
        throw new Error(
          `[${ruleId}] ${node.name} received a spread attribute. Use only ${[...allowed].join(", ") || "no props"}.`
        );
      }
      if (!allowed.has(attribute.name)) {
        throw new Error(
          `[${ruleId}] ${node.name} does not accept ${JSON.stringify(attribute.name)}. Use only ${[...allowed].join(", ") || "no props"}.`
        );
      }
      if (attributes.has(attribute.name)) {
        throw new Error(
          `[${ruleId}] ${node.name} prop ${JSON.stringify(attribute.name)} appears more than once. Keep one literal value.`
        );
      }
      attributes.set(attribute.name, attribute);
    });
  }

  return attributes;
};

const requireStringAttribute = (
  node: ArticleElement,
  attributes: ReadonlyMap<string, ArticleAttribute>,
  name: string,
  maximum: number,
  ruleId: string,
  diagnostics: ArticleDiagnostics,
  required = true
): string | undefined => {
  let value: string | undefined;
  diagnostics.capture(node, () => {
    const attribute = attributes.get(name);
    if (attribute === undefined && !required) {
      return;
    }
    if (
      attribute?.type !== "mdxJsxAttribute" ||
      typeof attribute.value !== "string" ||
      !isValidLabel(attribute.value, maximum)
    ) {
      throw new Error(
        `[${ruleId}] ${node.name}.${name} must be ${required ? "a required" : "an optional"} trimmed, single-line NFC string of 1–${maximum} characters.`
      );
    }
    const { value: attributeValue } = attribute;
    value = attributeValue;
  });
  return value;
};

const validateBareBooleanAttribute = (
  node: ArticleElement,
  attributes: ReadonlyMap<string, ArticleAttribute>,
  name: string,
  ruleId: string,
  diagnostics: ArticleDiagnostics
): void => {
  const attribute = attributes.get(name);
  if (attribute === undefined) {
    return undefined;
  }
  diagnostics.capture(attribute, () => {
    if (attribute.type !== "mdxJsxAttribute" || attribute.value !== null) {
      throw new Error(
        `[${ruleId}] ${node.name}.${name} is an optional bare boolean prop.`
      );
    }
  });
};

const validateNoNamedChildren = (
  node: ArticleElement,
  ruleId: string,
  diagnostics: ArticleDiagnostics
): void => {
  visit({ type: "root", children: node.children } as Root, (child) => {
    if (isNamedElement(child, articleElementNames)) {
      diagnostics.capture(child, () => {
        throw new Error(
          `[${ruleId}] ${node.name} children are ordinary Markdown and cannot contain ${child.name}.`
        );
      });
    }
  });
};

const validateOnlyChildren = (
  node: ArticleElement,
  allowedNames: ReadonlySet<string>,
  minimum: number,
  ruleId: string,
  diagnostics: ArticleDiagnostics
): void => {
  const validChildren = node.children.filter(
    (child) => isElement(child) && allowedNames.has(child.name ?? "")
  );
  for (const child of node.children) {
    if (!isElement(child) || !allowedNames.has(child.name ?? "")) {
      diagnostics.capture(child, () => {
        throw new Error(
          `[${ruleId}] ${node.name} contains ${isElement(child) ? JSON.stringify(child.name) : JSON.stringify(child.type)}. Use only ${[...allowedNames].join(" or ")} children.`
        );
      });
    }
  }
  diagnostics.capture(node, () => {
    if (validChildren.length < minimum) {
      throw new Error(
        `[${ruleId}] ${node.name} requires at least ${minimum} ${[...allowedNames].join(" or ")} child.`
      );
    }
  });
};

const expressionIconName = (
  attribute: ArticleAttribute
): string | undefined => {
  if (
    attribute.type !== "mdxJsxAttribute" ||
    typeof attribute.value !== "object" ||
    attribute.value === null ||
    !("data" in attribute.value)
  ) {
    return undefined;
  }

  const program = attribute.value.data?.estree;
  const statement = program?.body[0];
  if (
    program?.body.length !== 1 ||
    statement?.type !== "ExpressionStatement" ||
    statement.expression.type !== "JSXElement"
  ) {
    return undefined;
  }
  const element = statement.expression;
  if (
    element.openingElement.name.type !== "JSXIdentifier" ||
    element.openingElement.attributes.length !== 0 ||
    element.children.length !== 0 ||
    element.closingElement !== null
  ) {
    return undefined;
  }
  return element.openingElement.name.name;
};

interface FileTreeEntry {
  readonly children: FileTreeEntry[];
  readonly folder: boolean;
  readonly name: string;
}

const parseFileTreeLine = (
  line: string
): { readonly depth: number; readonly name: string } | undefined => {
  const teeIndex = line.indexOf("├── ");
  const elbowIndex = line.indexOf("└── ");
  const branchIndex = teeIndex === -1 ? elbowIndex : teeIndex;
  if (branchIndex !== -1) {
    const prefix = line.slice(0, branchIndex);
    if (!/^(?:│   |    )*$/u.test(prefix)) {
      return undefined;
    }
    return {
      depth: prefix.length / 4 + 1,
      name: line.slice(branchIndex + 4),
    };
  }
  const indentation = line.length - line.trimStart().length;
  if (!/^ *$/u.test(line.slice(0, indentation))) {
    return undefined;
  }
  if (indentation % 2 !== 0) {
    return undefined;
  }
  return { depth: indentation / 2, name: line.slice(indentation) };
};

const fileTreeElement = (entry: FileTreeEntry): ArticleFlowElement => ({
  type: "mdxJsxFlowElement",
  name: entry.folder ? "Folder" : "File",
  attributes: [
    {
      type: "mdxJsxAttribute",
      name: "name",
      value: entry.name,
    },
  ],
  children: entry.children.map(fileTreeElement),
});

const parseFileTree = (node: Code): readonly FileTreeEntry[] => {
  if (node.meta !== null && node.meta !== undefined) {
    throw new Error("[blog/files-fence] files fences do not accept metadata.");
  }
  const roots: FileTreeEntry[] = [];
  const stack: FileTreeEntry[] = [];
  const siblingNames = new Map<FileTreeEntry[], Set<string>>();

  for (const line of node.value.split("\n")) {
    const parsed = parseFileTreeLine(line);
    if (parsed === undefined || parsed.name.length === 0) {
      throw new Error(
        `[blog/files-fence] ${JSON.stringify(line)} is not a valid two-space-indented file-tree entry.`
      );
    }
    const folder = parsed.name.endsWith("/");
    const name = folder ? parsed.name.slice(0, -1) : parsed.name;
    if (!isValidLabel(name, 120) || /[/\\]/u.test(name)) {
      throw new Error(
        `[blog/files-fence] ${JSON.stringify(parsed.name)} is not a valid trimmed file or folder name.`
      );
    }
    if (parsed.depth > stack.length) {
      throw new Error(
        `[blog/files-fence] ${JSON.stringify(line)} skips a tree level. Indent one level at a time.`
      );
    }
    stack.length = parsed.depth;
    const siblings =
      parsed.depth === 0 ? roots : stack[parsed.depth - 1]?.children;
    const parent = parsed.depth === 0 ? undefined : stack[parsed.depth - 1];
    if (siblings === undefined || (parent !== undefined && !parent.folder)) {
      throw new Error(
        `[blog/files-fence] ${JSON.stringify(line)} is nested beneath a file. Only folders contain entries.`
      );
    }
    const names = siblingNames.get(siblings) ?? new Set<string>();
    siblingNames.set(siblings, names);
    if (names.has(name)) {
      throw new Error(
        `[blog/files-fence] ${JSON.stringify(name)} appears more than once in the same folder.`
      );
    }
    names.add(name);
    const entry: FileTreeEntry = { children: [], folder, name };
    siblings.push(entry);
    stack.push(entry);
  }
  if (roots.length === 0) {
    throw new Error(
      "[blog/files-fence] files fences require at least one entry."
    );
  }
  return roots;
};

const transformFileFences = (
  root: Root,
  diagnostics: ArticleDiagnostics
): void => {
  visit(root, "code", (node: Code) => {
    if (node.lang !== "files") {
      return;
    }
    diagnostics.capture(node, () => {
      const entries = parseFileTree(node);
      const replacement: ArticleFlowElement = {
        type: "mdxJsxFlowElement",
        name: "Files",
        attributes: [],
        children: entries.map(fileTreeElement),
        position: node.position,
      };
      Object.assign(node, replacement);
      delete (node as Partial<Code>).lang;
      delete (node as Partial<Code>).meta;
      delete (node as Partial<Code>).value;
    });
  });
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

const noProps = new Set<string>();
const titleProp = new Set(["title"]);
const calloutProps = new Set(["kind", "title"]);
const cardProps = new Set(["href", "icon", "title"]);
const fileProps = new Set(["name"]);
const folderProps = new Set(["defaultOpen", "name"]);

const validateCallout = (
  node: ArticleElement,
  diagnostics: ArticleDiagnostics
): void => {
  diagnostics.capture(node, () => {
    if (node.type !== "mdxJsxFlowElement") {
      throw new Error(
        "[blog/callout-position] Callout is a body-level composition."
      );
    }
  });
  const attributes = validateAllowedAttributes(
    node,
    calloutProps,
    "blog/callout-prop",
    diagnostics
  );
  const kind = requireStringAttribute(
    node,
    attributes,
    "kind",
    7,
    "blog/callout-kind",
    diagnostics
  );
  if (kind !== undefined) {
    diagnostics.capture(node, () => {
      if (!new Set(["danger", "note", "tip", "warning"]).has(kind)) {
        throw new Error(
          `[blog/callout-kind] Callout kind ${JSON.stringify(kind)} is invalid. Use note, tip, warning, or danger.`
        );
      }
    });
  }
  requireStringAttribute(
    node,
    attributes,
    "title",
    120,
    "blog/callout-title",
    diagnostics,
    false
  );
  diagnostics.capture(node, () => {
    if (node.children.length === 0) {
      throw new Error(
        "[blog/callout-children] Callout requires Markdown children."
      );
    }
  });
  validateNoNamedChildren(node, "blog/callout-children", diagnostics);
};

const validateCards = (
  node: ArticleElement,
  diagnostics: ArticleDiagnostics
): void => {
  diagnostics.capture(node, () => {
    if (node.type !== "mdxJsxFlowElement") {
      throw new Error(
        "[blog/cards-position] Cards is a body-level composition."
      );
    }
  });
  validateAllowedAttributes(node, noProps, "blog/cards-prop", diagnostics);
  validateOnlyChildren(
    node,
    new Set(["Card"]),
    1,
    "blog/cards-children",
    diagnostics
  );
};

const validateCard = (
  node: ArticleElement,
  parent: ArticleNode | undefined,
  iconImports: ReadonlySet<string>,
  consumedIcons: Set<string>,
  diagnostics: ArticleDiagnostics
): void => {
  diagnostics.capture(node, () => {
    if (!isElement(parent, "Cards")) {
      throw new Error(
        "[blog/card-position] Card must be a direct child of Cards."
      );
    }
  });
  const attributes = validateAllowedAttributes(
    node,
    cardProps,
    "blog/card-prop",
    diagnostics
  );
  requireStringAttribute(
    node,
    attributes,
    "title",
    120,
    "blog/card-title",
    diagnostics
  );
  const href = requireStringAttribute(
    node,
    attributes,
    "href",
    2048,
    "blog/card-href",
    diagnostics,
    false
  );
  const iconAttribute = attributes.get("icon");
  if (iconAttribute !== undefined) {
    diagnostics.capture(iconAttribute, () => {
      const iconName = expressionIconName(iconAttribute);
      if (iconName === undefined || !iconImports.has(iconName)) {
        const offendingValue =
          iconAttribute.type === "mdxJsxAttribute" &&
          typeof iconAttribute.value === "object" &&
          iconAttribute.value !== null
            ? iconAttribute.value.value
            : iconAttribute;
        throw new Error(
          `[blog/card-icon] Card.icon ${JSON.stringify(offendingValue)} is invalid. Use one imported, zero-prop Lucide icon element such as icon={<RocketIcon />}.`
        );
      }
      consumedIcons.add(iconName);
    });
  }
  validateNoNamedChildren(node, "blog/card-children", diagnostics);
  if (href !== undefined) {
    visit({ type: "root", children: node.children } as Root, (child) => {
      if (
        child.type === "link" ||
        child.type === "linkReference" ||
        (child.type === "listItem" &&
          child.checked !== null &&
          child.checked !== undefined)
      ) {
        const offendingContent =
          child.type === "listItem" ? "a task-list input" : "a nested link";
        diagnostics.capture(child, () => {
          throw new Error(
            `[blog/card-interactive] A linked Card is one link and cannot contain ${offendingContent}. Use ordinary non-interactive Markdown children.`
          );
        });
      }
    });
  }
};

const validateFiles = (
  node: ArticleElement,
  diagnostics: ArticleDiagnostics
): void => {
  diagnostics.capture(node, () => {
    if (node.type !== "mdxJsxFlowElement") {
      throw new Error(
        "[blog/files-position] Files is a body-level composition."
      );
    }
  });
  validateAllowedAttributes(node, noProps, "blog/files-prop", diagnostics);
  validateOnlyChildren(
    node,
    new Set(["File", "Folder"]),
    1,
    "blog/files-children",
    diagnostics
  );
};

const validateFileTreeEntry = (
  node: ArticleElement,
  parent: ArticleNode | undefined,
  allowedProps: ReadonlySet<string>,
  entryName: "File" | "Folder",
  diagnostics: ArticleDiagnostics
): ReadonlyMap<string, ArticleAttribute> => {
  const rulePrefix = `blog/${entryName.toLowerCase()}`;
  diagnostics.capture(node, () => {
    if (
      !isElement(parent) ||
      (parent.name !== "Files" && parent.name !== "Folder")
    ) {
      throw new Error(
        `[${rulePrefix}-position] ${entryName} must be a direct child of Files or Folder.`
      );
    }
  });
  const attributes = validateAllowedAttributes(
    node,
    allowedProps,
    `${rulePrefix}-prop`,
    diagnostics
  );
  const name = requireStringAttribute(
    node,
    attributes,
    "name",
    120,
    `${rulePrefix}-name`,
    diagnostics
  );
  if (name !== undefined) {
    diagnostics.capture(node, () => {
      if (/[/\\]/u.test(name)) {
        throw new Error(
          `[${rulePrefix}-name] ${entryName} name ${JSON.stringify(name)} cannot contain a path separator. Express hierarchy with nested Folder elements.`
        );
      }
    });
  }
  return attributes;
};

const validateFolder = (
  node: ArticleElement,
  parent: ArticleNode | undefined,
  diagnostics: ArticleDiagnostics
): void => {
  const attributes = validateFileTreeEntry(
    node,
    parent,
    folderProps,
    "Folder",
    diagnostics
  );
  validateBareBooleanAttribute(
    node,
    attributes,
    "defaultOpen",
    "blog/folder-prop",
    diagnostics
  );
  validateOnlyChildren(
    node,
    new Set(["File", "Folder"]),
    0,
    "blog/folder-children",
    diagnostics
  );
};

const validateFile = (
  node: ArticleElement,
  parent: ArticleNode | undefined,
  diagnostics: ArticleDiagnostics
): void => {
  validateFileTreeEntry(node, parent, fileProps, "File", diagnostics);
  for (const child of node.children) {
    diagnostics.capture(child, () => {
      throw new Error(
        `[blog/file-children] File contains ${isElement(child) ? JSON.stringify(child.name) : JSON.stringify(child.type)}. File accepts no children; use a self-closing File element.`
      );
    });
  }
};

const validateSteps = (
  node: ArticleElement,
  diagnostics: ArticleDiagnostics
): void => {
  diagnostics.capture(node, () => {
    if (node.type !== "mdxJsxFlowElement") {
      throw new Error(
        "[blog/steps-position] Steps is a body-level composition."
      );
    }
  });
  validateAllowedAttributes(node, noProps, "blog/steps-prop", diagnostics);
  validateOnlyChildren(
    node,
    new Set(["Step"]),
    1,
    "blog/steps-children",
    diagnostics
  );
};

const validateStep = (
  node: ArticleElement,
  parent: ArticleNode | undefined,
  diagnostics: ArticleDiagnostics
): void => {
  diagnostics.capture(node, () => {
    if (!isElement(parent, "Steps")) {
      throw new Error(
        "[blog/step-position] Step must be a direct child of Steps."
      );
    }
  });
  const attributes = validateAllowedAttributes(
    node,
    titleProp,
    "blog/step-prop",
    diagnostics
  );
  requireStringAttribute(
    node,
    attributes,
    "title",
    120,
    "blog/step-title",
    diagnostics
  );
  diagnostics.capture(node, () => {
    if (node.children.length === 0) {
      throw new Error("[blog/step-children] Step requires Article content.");
    }
  });
};

const validateKbd = (
  node: ArticleElement,
  diagnostics: ArticleDiagnostics
): void => {
  diagnostics.capture(node, () => {
    if (node.type !== "mdxJsxTextElement") {
      throw new Error(
        "[blog/kbd-position] Kbd is inline-only. Place it inside Markdown prose."
      );
    }
  });
  validateAllowedAttributes(node, noProps, "blog/kbd-prop", diagnostics);
  diagnostics.capture(node, () => {
    if (
      node.children.length !== 1 ||
      node.children[0].type !== "text" ||
      !isValidLabel(node.children[0].value, Number.MAX_SAFE_INTEGER)
    ) {
      throw new Error(
        "[blog/kbd-children] Kbd accepts exactly one trimmed literal text child."
      );
    }
  });
};

const validateClosedLanguage = (
  root: Root,
  imports: ArticleImports,
  diagnostics: ArticleDiagnostics
): void => {
  const consumedAssets = new Set<string>();
  const consumedIcons = new Set<string>();

  visit(root, (node, _index, parent) => {
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
        if (typeof node.name === "string" && imports.icons.has(node.name)) {
          throw new Error(
            `[blog/icon-position] Lucide icon ${JSON.stringify(node.name)} is allowed only as a zero-prop Card.icon value.`
          );
        }
        if (!articleElementNames.has(node.name ?? "")) {
          const ruleId =
            typeof node.name === "string" &&
            node.name === node.name.toLowerCase()
              ? "blog/raw-html"
              : "blog/element";
          throw new Error(
            `[${ruleId}] ${JSON.stringify(node.name)} is not an approved Article element.`
          );
        }
        if (node.name === "Figure") {
          validateFigure(node, imports.assets, consumedAssets, diagnostics);
        } else if (node.name === "Callout") {
          validateCallout(node, diagnostics);
        } else if (node.name === "Cards") {
          validateCards(node, diagnostics);
        } else if (node.name === "Card") {
          validateCard(node, parent, imports.icons, consumedIcons, diagnostics);
        } else if (node.name === "Files") {
          validateFiles(node, diagnostics);
        } else if (node.name === "Folder") {
          validateFolder(node, parent, diagnostics);
        } else if (node.name === "File") {
          validateFile(node, parent, diagnostics);
        } else if (node.name === "Steps") {
          validateSteps(node, diagnostics);
        } else if (node.name === "Step") {
          validateStep(node, parent, diagnostics);
        } else if (node.name === "Kbd") {
          validateKbd(node, diagnostics);
        }
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

  for (const localName of imports.assets.keys()) {
    if (!consumedAssets.has(localName)) {
      diagnostics.capture(root, () => {
        throw new Error(
          `[blog/import-unused] Imported Article asset ${JSON.stringify(localName)} is not consumed by a Figure. Add a Figure or remove the import.`
        );
      });
    }
  }
  for (const iconName of imports.icons) {
    if (!consumedIcons.has(iconName)) {
      diagnostics.capture(root, () => {
        throw new Error(
          `[blog/import-unused] Imported Lucide icon ${JSON.stringify(iconName)} is not consumed by Card.icon. Add it to a Card or remove the import.`
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
      } else if (
        (node.type === "mdxJsxFlowElement" ||
          node.type === "mdxJsxTextElement") &&
        node.name === "Card"
      ) {
        href = findStringAttribute(node, "href");
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
    transformFileFences(root, diagnostics);
    const imports = collectImports(root, diagnostics);
    validateClosedLanguage(root, imports, diagnostics);
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
