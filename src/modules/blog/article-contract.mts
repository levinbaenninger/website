import GithubSlugger from "github-slugger";
import type { Definition, Heading, Root } from "mdast";
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
const ICON_IMPORT_PATTERN =
  /^import\s*\{\s*([A-Za-z_$][\w$]*(?:\s*,\s*[A-Za-z_$][\w$]*)*)\s*\}\s*from\s*["']lucide-react["'];?\s*$/u;
const SUPPORTED_ASSET_PATTERN =
  /^\.\/assets\/[a-z0-9]+(?:[/-][a-z0-9]+)*(?:\.avif|\.jpeg|\.jpg|\.png|\.svg|\.webp)$/u;
// This compile-time list cannot import the React registry without pulling its
// client module graph into the build-only MDX transform.
const ARTICLE_COMPONENT_NAMES = new Set([
  "Accordion",
  "AccordionItem",
  "Figure",
  "Tab",
  "Tabs",
]);

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
    const title =
      (node.type === "mdxJsxFlowElement" ||
        node.type === "mdxJsxTextElement") &&
      (node.name === "AccordionItem" || node.name === "Tab")
        ? node.attributes.find(
            (attribute) =>
              attribute.type === "mdxJsxAttribute" &&
              attribute.name === "title" &&
              typeof attribute.value === "string"
          )?.value
        : undefined;
    return [title, ...node.children.map(searchableText)]
      .filter((value): value is string => value !== undefined && value !== "")
      .join(separator);
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

interface ArticleImports {
  readonly assets: ReadonlyMap<string, string>;
  readonly icons: ReadonlySet<string>;
}

const assertImportDoesNotShadowRegistry = (localName: string): void => {
  if (ARTICLE_COMPONENT_NAMES.has(localName)) {
    throw new Error(
      `[blog/import-shadow] Import ${JSON.stringify(localName)} shadows an Article registry component. Choose a local name other than ${[...ARTICLE_COMPONENT_NAMES].map((componentName) => JSON.stringify(componentName)).join(", ")}.`
    );
  }
};

const collectArticleImports = (
  root: Root,
  diagnostics: ArticleDiagnostics
): ArticleImports => {
  const assets = new Map<string, string>();
  const icons = new Set<string>();
  const importedAssets = new Set<string>();

  visit(root, "mdxjsEsm", (node) => {
    diagnostics.capture(node, () => {
      if (node.value === "") {
        return;
      }

      const iconMatch = ICON_IMPORT_PATTERN.exec(node.value);
      if (iconMatch !== null) {
        const names = iconMatch[1]?.split(",").map((name) => name.trim()) ?? [];
        for (const name of names) {
          assertImportDoesNotShadowRegistry(name);
          if (icons.has(name) || assets.has(name)) {
            throw new Error(
              `[blog/icon-import] Lucide icon ${JSON.stringify(name)} is imported more than once. Keep one unaliased named import.`
            );
          }
          icons.add(name);
        }
        return;
      }

      if (!ASSET_IMPORT_PATTERN.test(node.value)) {
        if (node.value.includes("lucide-react")) {
          throw new Error(
            '[blog/icon-import] Lucide icons require unaliased named imports from "lucide-react". Use import { IconName } from "lucide-react".'
          );
        }
        const ruleId = node.value.trimStart().startsWith("import")
          ? "blog/import"
          : "blog/export";
        throw new Error(
          `[${ruleId}] Article-authored modules are limited to default local image imports and unaliased named Lucide imports.`
        );
      }

      const normalizedImport = node.value.trim().replace(/;$/u, "");
      const fromIndex = normalizedImport.indexOf(" from ");
      const localName = normalizedImport
        .slice("import ".length, fromIndex)
        .trim();
      assertImportDoesNotShadowRegistry(localName);
      const quotedSpecifier = normalizedImport.slice(
        fromIndex + " from ".length
      );
      const specifier = quotedSpecifier.slice(1, -1);
      if (!SUPPORTED_ASSET_PATTERN.test(specifier)) {
        throw new Error(
          `[blog/import] ${JSON.stringify(specifier)} is not an approved Article-local still-image import. Use AVIF, WebP, PNG, JPEG, or SVG.`
        );
      }
      if (
        assets.has(localName) ||
        icons.has(localName) ||
        importedAssets.has(specifier)
      ) {
        throw new Error(
          `[blog/import-duplicate] ${JSON.stringify(specifier)} is imported more than once. Reuse one binding.`
        );
      }

      assets.set(localName, specifier);
      importedAssets.add(specifier);
    });
  });

  return { assets, icons };
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

type ArticleComponentNode = Extract<
  Root["children"][number],
  { readonly type: "mdxJsxFlowElement" | "mdxJsxTextElement" }
>;

const validateFigure = (
  node: ArticleComponentNode,
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

const meaningfulComponentChildren = (
  node: ArticleComponentNode
): readonly Root["children"][number][] =>
  node.children.filter(
    (child) => child.type !== "text" || child.value.trim() !== ""
  );

const authoredAttributeValue = (
  attribute: ArticleComponentNode["attributes"][number] | undefined
): unknown => {
  if (attribute === undefined) {
    return undefined;
  }
  if (attribute.type !== "mdxJsxAttribute") {
    return "spread";
  }
  if (attribute.value !== null && typeof attribute.value === "object") {
    return attribute.value.value;
  }
  return attribute.value;
};

const validateLiteralTitle = (
  node: ArticleComponentNode,
  component: "AccordionItem" | "Tab",
  attribute: ArticleComponentNode["attributes"][number] | undefined,
  diagnostics: ArticleDiagnostics
): string | undefined => {
  let title: string | undefined;
  diagnostics.capture(attribute ?? node, () => {
    const ruleId =
      component === "Tab" ? "blog/tab-title" : "blog/accordion-item-title";
    const maximum = component === "Tab" ? 40 : 120;
    if (
      attribute?.type !== "mdxJsxAttribute" ||
      attribute.name !== "title" ||
      typeof attribute.value !== "string" ||
      attribute.value.length === 0 ||
      attribute.value !== attribute.value.trim() ||
      /[\n\r\u2028\u2029]/u.test(attribute.value) ||
      !attribute.value.isWellFormed() ||
      attribute.value.normalize("NFC") !== attribute.value ||
      [
        ...new Intl.Segmenter(undefined, {
          granularity: "grapheme",
        }).segment(attribute.value),
      ].length > maximum
    ) {
      throw new Error(
        `[${ruleId}] ${component} title ${JSON.stringify(authoredAttributeValue(attribute))} is invalid. Use one literal, trimmed, single-line NFC title of 1–${maximum} characters.`
      );
    }
    title = attribute.value;
  });
  return title;
};

const validateNoComponentProps = (
  node: ArticleComponentNode,
  component: "Accordion" | "Tabs",
  diagnostics: ArticleDiagnostics
): void => {
  for (const attribute of node.attributes) {
    diagnostics.capture(attribute, () => {
      const ruleId =
        component === "Tabs" ? "blog/tabs-prop" : "blog/accordion-prop";
      const name =
        attribute.type === "mdxJsxAttribute" ? attribute.name : "spread";
      throw new Error(
        `[${ruleId}] ${component} does not accept author-controlled prop ${JSON.stringify(name)}.`
      );
    });
  }
};

const validateAccordion = (
  node: ArticleComponentNode,
  diagnostics: ArticleDiagnostics
): void => {
  validateNoComponentProps(node, "Accordion", diagnostics);
  const children = meaningfulComponentChildren(node);
  diagnostics.capture(node, () => {
    if (
      children.length === 0 ||
      children.some(
        (child) =>
          (child.type !== "mdxJsxFlowElement" &&
            child.type !== "mdxJsxTextElement") ||
          child.name !== "AccordionItem"
      )
    ) {
      throw new Error(
        "[blog/accordion-children] Accordion requires one or more direct AccordionItem children and no other content."
      );
    }
  });
};

const validateAccordionItem = (
  node: ArticleComponentNode,
  parent: ArticleComponentNode | undefined,
  diagnostics: ArticleDiagnostics
): void => {
  diagnostics.capture(node, () => {
    if (parent?.name !== "Accordion") {
      throw new Error(
        "[blog/accordion-item-parent] AccordionItem must be a direct child of Accordion."
      );
    }
  });

  let titleAttribute: ArticleComponentNode["attributes"][number] | undefined;
  let defaultOpenCount = 0;
  for (const attribute of node.attributes) {
    if (
      attribute.type === "mdxJsxAttribute" &&
      attribute.name === "title" &&
      titleAttribute === undefined
    ) {
      titleAttribute = attribute;
      continue;
    }
    diagnostics.capture(attribute, () => {
      if (
        attribute.type === "mdxJsxAttribute" &&
        attribute.name === "defaultOpen"
      ) {
        defaultOpenCount += 1;
        if (defaultOpenCount > 1 || attribute.value !== null) {
          throw new Error(
            `[blog/accordion-item-default] AccordionItem defaultOpen received ${JSON.stringify(authoredAttributeValue(attribute))}. Use an optional bare defaultOpen boolean prop that appears once.`
          );
        }
        return;
      }
      const name =
        attribute.type === "mdxJsxAttribute" ? attribute.name : "spread";
      throw new Error(
        `[blog/accordion-item-prop] AccordionItem does not accept ${JSON.stringify(name)}. Use only title and optional bare defaultOpen.`
      );
    });
  }
  validateLiteralTitle(node, "AccordionItem", titleAttribute, diagnostics);
  diagnostics.capture(node, () => {
    if (meaningfulComponentChildren(node).length === 0) {
      throw new Error(
        "[blog/accordion-item-children] AccordionItem requires Markdown children."
      );
    }
  });
};

const validateTabs = (
  node: ArticleComponentNode,
  ancestors: readonly ArticleComponentNode[],
  diagnostics: ArticleDiagnostics
): void => {
  validateNoComponentProps(node, "Tabs", diagnostics);
  diagnostics.capture(node, () => {
    if (ancestors.some((ancestor) => ancestor.name === "Tabs")) {
      throw new Error(
        "[blog/tabs-nested] General Tabs cannot be nested inside other general Tabs."
      );
    }
  });
  const children = meaningfulComponentChildren(node);
  diagnostics.capture(node, () => {
    if (
      children.length < 2 ||
      children.some(
        (child) =>
          (child.type !== "mdxJsxFlowElement" &&
            child.type !== "mdxJsxTextElement") ||
          child.name !== "Tab"
      )
    ) {
      throw new Error(
        "[blog/tabs-count] Tabs requires at least two direct Tab children and no other content."
      );
    }
  });
};

const validateTabIcon = (
  attribute: ArticleComponentNode["attributes"][number],
  importedIcons: ReadonlySet<string>,
  consumedIcons: Set<string>,
  diagnostics: ArticleDiagnostics
): void => {
  diagnostics.capture(attribute, () => {
    const expression =
      attribute.type === "mdxJsxAttribute" &&
      attribute.name === "icon" &&
      attribute.value !== null &&
      typeof attribute.value === "object"
        ? attribute.value.value.trim()
        : "";
    const match = /^<([A-Za-z_$][\w$]*)\s*\/>$/u.exec(expression);
    const iconName = match?.[1];
    if (iconName === undefined || !importedIcons.has(iconName)) {
      throw new Error(
        `[blog/tab-icon] Tab icon ${JSON.stringify(expression)} is invalid. Use one imported Lucide icon rendered as a zero-prop self-closing element.`
      );
    }
    consumedIcons.add(iconName);
  });
};

const validateTab = (
  node: ArticleComponentNode,
  parent: ArticleComponentNode | undefined,
  importedIcons: ReadonlySet<string>,
  consumedIcons: Set<string>,
  diagnostics: ArticleDiagnostics
): string | undefined => {
  diagnostics.capture(node, () => {
    if (parent?.name !== "Tabs") {
      throw new Error("[blog/tab-parent] Tab must be a direct child of Tabs.");
    }
  });

  let titleAttribute: ArticleComponentNode["attributes"][number] | undefined;
  let iconCount = 0;
  for (const attribute of node.attributes) {
    if (
      attribute.type === "mdxJsxAttribute" &&
      attribute.name === "title" &&
      titleAttribute === undefined
    ) {
      titleAttribute = attribute;
      continue;
    }
    if (attribute.type === "mdxJsxAttribute" && attribute.name === "icon") {
      iconCount += 1;
      if (iconCount === 1) {
        validateTabIcon(attribute, importedIcons, consumedIcons, diagnostics);
        continue;
      }
    }
    diagnostics.capture(attribute, () => {
      const name =
        attribute.type === "mdxJsxAttribute" ? attribute.name : "spread";
      throw new Error(
        `[blog/tab-prop] Tab does not accept ${JSON.stringify(name)}. Use only title and one optional icon.`
      );
    });
  }
  const title = validateLiteralTitle(node, "Tab", titleAttribute, diagnostics);
  diagnostics.capture(node, () => {
    if (meaningfulComponentChildren(node).length === 0) {
      throw new Error(
        "[blog/tab-children] Tab requires Markdown or approved component children."
      );
    }
  });
  return title;
};

const validateClosedLanguage = (
  root: Root,
  imports: ArticleImports,
  diagnostics: ArticleDiagnostics
): void => {
  const consumedAssets = new Set<string>();
  const consumedIcons = new Set<string>();
  const tabTitles = new Map<ArticleComponentNode, Set<string>>();

  const validateNode = (
    node: Root | Root["children"][number],
    ancestors: readonly ArticleComponentNode[]
  ): void => {
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
        const parent = ancestors.at(-1);
        if (ancestors.some((ancestor) => ancestor.name === "AccordionItem")) {
          throw new Error(
            `[blog/accordion-item-children] AccordionItem children may contain Markdown but not Article component ${node.name}.`
          );
        }
        if (node.name === "Figure") {
          validateFigure(node, imports.assets, consumedAssets, diagnostics);
        } else if (node.name === "Accordion") {
          validateAccordion(node, diagnostics);
        } else if (node.name === "AccordionItem") {
          validateAccordionItem(node, parent, diagnostics);
        } else if (node.name === "Tabs") {
          validateTabs(node, ancestors, diagnostics);
          tabTitles.set(node, new Set());
        } else if (node.name === "Tab") {
          const title = validateTab(
            node,
            parent,
            imports.icons,
            consumedIcons,
            diagnostics
          );
          if (parent?.name === "Tabs" && title !== undefined) {
            const titles = tabTitles.get(parent);
            diagnostics.capture(node, () => {
              if (titles?.has(title) === true) {
                throw new Error(
                  `[blog/tab-title-duplicate] Tab title ${JSON.stringify(title)} appears more than once in the same Tabs. Use unique titles.`
                );
              }
              titles?.add(title);
            });
          }
        } else {
          const ruleId =
            typeof node.name === "string" &&
            node.name === node.name.toLowerCase()
              ? "blog/raw-html"
              : "blog/element";
          throw new Error(
            `[${ruleId}] ${JSON.stringify(node.name)} is not an approved Article element. Use Figure, Accordion, Tabs, or approved Markdown.`
          );
        }
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

    if ("children" in node && Array.isArray(node.children)) {
      const nextAncestors =
        node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement"
          ? [...ancestors, node]
          : ancestors;
      for (const child of node.children) {
        validateNode(child, nextAncestors);
      }
    }
  };

  validateNode(root, []);

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
          `[blog/import-unused] Imported Lucide icon ${JSON.stringify(iconName)} is not consumed by a general Tab icon. Add it to Tab.icon or remove the import.`
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
    const imports = collectArticleImports(root, diagnostics);
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
