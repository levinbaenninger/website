import GithubSlugger from "github-slugger";
import type { Heading, Link, Root } from "mdast";
import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";

import type {
  ArticleCompilationFacts,
  ArticleHeadingFact,
  ArticleLinkFact,
} from "./article-facts.ts";

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

const assignHeadingIds = (root: Root): readonly ArticleHeadingFact[] => {
  const headings: ArticleHeadingFact[] = [];
  const slugger = new GithubSlugger();

  visit(root, "heading", (heading: Heading) => {
    if (heading.depth === 1) {
      throw new Error(
        "[blog/heading-h1] Article bodies begin at h2; the Article title supplies the only h1."
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

  return headings;
};

const collectAssetImports = (root: Root): ReadonlyMap<string, string> => {
  const imports = new Map<string, string>();
  const importedSpecifiers = new Set<string>();

  visit(root, "mdxjsEsm", (node) => {
    if (node.value === "") {
      return;
    }

    const match = ASSET_IMPORT_PATTERN.exec(node.value);
    if (match === null) {
      const ruleId = node.value.trimStart().startsWith("import")
        ? "blog/import"
        : "blog/export";
      throw new Error(
        `[${ruleId}] Article-authored modules are limited to default local image imports.`
      );
    }

    const normalizedImport = node.value.trim().replace(/;$/u, "");
    const fromIndex = normalizedImport.indexOf(" from ");
    const localName = normalizedImport
      .slice("import ".length, fromIndex)
      .trim();
    const quotedSpecifier = normalizedImport.slice(fromIndex + " from ".length);
    const specifier = quotedSpecifier.slice(1, -1);
    if (!SUPPORTED_ASSET_PATTERN.test(specifier)) {
      throw new Error(
        `[blog/import] ${JSON.stringify(specifier)} is not an approved Article-local still-image import.`
      );
    }
    if (imports.has(localName) || importedSpecifiers.has(specifier)) {
      throw new Error(
        `[blog/import-duplicate] ${JSON.stringify(specifier)} is imported more than once.`
      );
    }

    imports.set(localName, specifier);
    importedSpecifiers.add(specifier);
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
  imports: ReadonlyMap<string, string>
): void => {
  const consumedImports = new Set<string>();

  visit(root, (node) => {
    if (node.type === "html") {
      throw new Error(
        "[blog/raw-html] Raw HTML is outside the closed Article language."
      );
    }
    if (
      node.type === "mdxFlowExpression" ||
      node.type === "mdxTextExpression"
    ) {
      throw new Error(
        "[blog/expression] Arbitrary JavaScript expressions are outside the closed Article language."
      );
    }
    if (
      node.type === "mdxJsxFlowElement" ||
      node.type === "mdxJsxTextElement"
    ) {
      if (node.name !== "Figure") {
        const ruleId =
          typeof node.name === "string" && node.name === node.name.toLowerCase()
            ? "blog/raw-html"
            : "blog/element";
        throw new Error(
          `[${ruleId}] ${JSON.stringify(node.name)} is not an approved Article element.`
        );
      }
      validateFigure(node, imports, consumedImports);
      return;
    }
    if (node.type === "image" || node.type === "imageReference") {
      throw new Error(
        "[blog/image] Figure is the only supported body-image primitive."
      );
    }
    if (
      node.type === "footnoteDefinition" ||
      node.type === "footnoteReference"
    ) {
      throw new Error(
        "[blog/footnote] Footnotes are outside the closed Article language."
      );
    }
  });

  for (const localName of imports.keys()) {
    if (!consumedImports.has(localName)) {
      throw new Error(
        `[blog/import-unused] Imported Article asset ${JSON.stringify(localName)} is not consumed by a Figure.`
      );
    }
  }
};

const validateLinks = (
  root: Root,
  headings: readonly ArticleHeadingFact[]
): readonly ArticleLinkFact[] => {
  const headingIds = new Set(headings.map(({ id }) => id));
  const links: ArticleLinkFact[] = [];

  visit(root, "link", (link: Link) => {
    const href = link.url;

    if (href.startsWith("#")) {
      const fragment = href.slice(1);
      if (fragment.length === 0 || !headingIds.has(fragment)) {
        throw new Error(
          `[blog/link-fragment] Same-Article fragment ${JSON.stringify(fragment)} does not match a heading.`
        );
      }
    } else if (href.startsWith("/")) {
      if (href.startsWith("//")) {
        throw new Error(
          "[blog/link-internal] Protocol-relative links are not internal Article links."
        );
      }
      if (href.includes("?")) {
        throw new Error(
          "[blog/link-query] Authored internal links cannot contain query strings."
        );
      }
    } else if (href.startsWith("https://")) {
      try {
        const parsed = new URL(href);
        if (parsed.protocol !== "https:") {
          throw new Error("Unexpected parsed protocol.");
        }
      } catch {
        throw new Error(
          `[blog/link-external] ${JSON.stringify(href)} is not a valid absolute HTTPS URL.`
        );
      }
    } else if (/^[a-z][a-z0-9+.-]*:/iu.test(href)) {
      throw new Error(
        `[blog/link-scheme] ${JSON.stringify(href)} does not use the required HTTPS scheme.`
      );
    } else {
      throw new Error(
        `[blog/link-relative] ${JSON.stringify(href)} is not an approved root-relative Article link.`
      );
    }

    links.push({ href });
  });

  return links;
};

export default function articleContract() {
  return (root: Root): void => {
    const imports = collectAssetImports(root);
    validateClosedLanguage(root, imports);
    const headings = assignHeadingIds(root);
    const facts: ArticleCompilationFacts = {
      headings,
      links: validateLinks(root, headings),
      searchText: collectSearchText(root),
    };

    root.children.push(factsExport(facts));
  };
}
