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

  capture(node: { readonly position?: ArticlePosition }, action: () => void) {
    try {
      action();
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

const validateFigureCaption = (root: Root): void => {
  visit(root, (node) => {
    if (
      node.type !== "root" &&
      node.type !== "mdxJsxFlowElement" &&
      !captionNodeTypes.has(node.type)
    ) {
      throw new Error(
        `[blog/figure-caption] ${JSON.stringify(node.type)} is not inline Figure caption content.`
      );
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
  consumedImports: Set<string>
): void => {
  if (node.type === "mdxJsxTextElement") {
    throw new Error(
      "[blog/figure-position] Figure is a body-level element and cannot appear inline."
    );
  }

  let alternativeCount = 0;
  let sourceName: string | undefined;
  const seenAttributes = new Set<string>();

  for (const attribute of node.attributes) {
    if (
      attribute.type !== "mdxJsxAttribute" ||
      typeof attribute.name !== "string"
    ) {
      throw new Error(
        "[blog/figure-prop] Figure does not accept spread or expression attributes."
      );
    }

    if (
      attribute.name !== "src" &&
      attribute.name !== "alt" &&
      attribute.name !== "decorative"
    ) {
      throw new Error(
        `[blog/figure-prop] Figure does not accept ${JSON.stringify(attribute.name)}.`
      );
    }
    if (seenAttributes.has(attribute.name)) {
      throw new Error(
        `[blog/figure-prop] Figure prop ${JSON.stringify(attribute.name)} may appear only once.`
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
          "[blog/figure-source] Figure src must reference one imported Article-local image."
        );
      }
      sourceName = attribute.value.value;
      continue;
    }

    if (attribute.name === "alt") {
      if (
        typeof attribute.value !== "string" ||
        attribute.value.length === 0 ||
        attribute.value !== attribute.value.trim() ||
        !attribute.value.isWellFormed() ||
        attribute.value.normalize("NFC") !== attribute.value ||
        [
          ...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(
            attribute.value
          ),
        ].length > 500
      ) {
        throw new Error(
          "[blog/figure-alt] Figure alt must be informative, trimmed NFC text of 1–500 characters."
        );
      }
      alternativeCount += 1;
      continue;
    }

    if (attribute.value !== null) {
      throw new Error(
        "[blog/figure-alternative] Figure decorative is a boolean declaration."
      );
    }
    alternativeCount += 1;
  }

  if (alternativeCount !== 1) {
    throw new Error(
      "[blog/figure-alternative] Figure requires exactly one informative alt or decorative declaration."
    );
  }
  if (sourceName === undefined || !imports.has(sourceName)) {
    throw new Error(
      "[blog/figure-source] Figure src must reference one imported Article-local image."
    );
  }

  consumedImports.add(sourceName);
  validateFigureCaption({
    type: "root",
    children: node.children,
  });
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
        validateFigure(node, imports, consumedImports);
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
      "[blog/link-query] Authored internal links cannot contain query strings."
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
        "[blog/link-internal] Protocol-relative links are not internal Article links."
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
