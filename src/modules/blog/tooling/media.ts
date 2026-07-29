import { DOMParser } from "@xmldom/xmldom";
import type {
  Document as XmlDocument,
  Element as XmlElement,
  Node as XmlNode,
} from "@xmldom/xmldom";
import sharp from "sharp";

import type { BlogDiagnostic } from "./diagnostics.ts";

const RASTER_BYTE_LIMIT = 10 * 1024 * 1024;
const SVG_BYTE_LIMIT = 1024 * 1024;
const DIMENSION_LIMIT = 8192;
const PIXEL_LIMIT = 40_000_000;
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const SVG_ELEMENTS = new Set([
  "circle",
  "clipPath",
  "defs",
  "desc",
  "ellipse",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "filter",
  "g",
  "linearGradient",
  "line",
  "marker",
  "mask",
  "metadata",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "stop",
  "svg",
  "symbol",
  "text",
  "textPath",
  "title",
  "tspan",
  "use",
]);

const SVG_ATTRIBUTES = new Set([
  "accent-height",
  "alignment-baseline",
  "amplitude",
  "aria-hidden",
  "azimuth",
  "baseFrequency",
  "baseline-shift",
  "bias",
  "by",
  "class",
  "clip",
  "clip-path",
  "clip-rule",
  "clipPathUnits",
  "color",
  "color-interpolation",
  "color-interpolation-filters",
  "color-rendering",
  "cx",
  "cy",
  "d",
  "diffuseConstant",
  "direction",
  "display",
  "divisor",
  "dominant-baseline",
  "dx",
  "dy",
  "edgeMode",
  "elevation",
  "exponent",
  "fill",
  "fill-opacity",
  "fill-rule",
  "filter",
  "filterRes",
  "filterUnits",
  "flood-color",
  "flood-opacity",
  "font-size",
  "font-stretch",
  "font-style",
  "font-variant",
  "font-weight",
  "fr",
  "from",
  "fx",
  "fy",
  "gradientTransform",
  "gradientUnits",
  "height",
  "href",
  "id",
  "image-rendering",
  "in",
  "in2",
  "intercept",
  "k1",
  "k2",
  "k3",
  "k4",
  "kernelMatrix",
  "kernelUnitLength",
  "lengthAdjust",
  "lighting-color",
  "marker-end",
  "marker-mid",
  "marker-start",
  "markerHeight",
  "markerUnits",
  "markerWidth",
  "mask",
  "maskContentUnits",
  "maskUnits",
  "mode",
  "numOctaves",
  "offset",
  "opacity",
  "operator",
  "order",
  "orient",
  "origin",
  "overflow",
  "paint-order",
  "pathLength",
  "patternContentUnits",
  "patternTransform",
  "patternUnits",
  "points",
  "preserveAlpha",
  "preserveAspectRatio",
  "primitiveUnits",
  "r",
  "radius",
  "refX",
  "refY",
  "result",
  "rotate",
  "rx",
  "ry",
  "scale",
  "seed",
  "shape-rendering",
  "slope",
  "spacing",
  "specularConstant",
  "specularExponent",
  "spreadMethod",
  "stdDeviation",
  "stitchTiles",
  "stop-color",
  "stop-opacity",
  "stroke",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-opacity",
  "stroke-width",
  "surfaceScale",
  "systemLanguage",
  "tableValues",
  "targetX",
  "targetY",
  "text-anchor",
  "text-decoration",
  "text-rendering",
  "textLength",
  "to",
  "transform",
  "transform-origin",
  "type",
  "values",
  "vector-effect",
  "viewBox",
  "visibility",
  "width",
  "word-spacing",
  "writing-mode",
  "x",
  "x1",
  "x2",
  "xChannelSelector",
  "xmlns",
  "xmlns:xlink",
  "xlink:href",
  "y",
  "y1",
  "y2",
  "yChannelSelector",
  "z",
]);

const isXmlElement = (
  node: XmlNode,
  elementNodeType: number
): node is XmlElement => node.nodeType === elementNodeType;

interface MediaInput {
  readonly absolutePath: string;
  readonly source: string;
  readonly articleSlug: string;
  readonly extension: string;
  readonly bytes: Uint8Array;
}

const diagnostic = (
  input: MediaInput,
  ruleId: string,
  explanation: string,
  guidance: string,
  value?: unknown,
  line?: number,
  column?: number
): BlogDiagnostic => ({
  articleSlug: input.articleSlug,
  source: input.source,
  ruleId,
  explanation,
  guidance,
  value,
  line,
  column,
});

const detectedRasterFormat = (bytes: Uint8Array): string | undefined => {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "jpeg";
  }
  const ascii = (start: number, length: number): string =>
    Buffer.from(bytes.subarray(start, start + length)).toString("ascii");
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    return "webp";
  }
  if (bytes.length >= 12 && ascii(4, 4) === "ftyp") {
    const brands = ascii(8, Math.min(bytes.length - 8, 32));
    if (brands.includes("avif") || brands.includes("avis")) {
      return "avif";
    }
  }
  return undefined;
};

const hasApngAnimation = (bytes: Uint8Array): boolean => {
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = Buffer.from(bytes).readUInt32BE(offset);
    const type = Buffer.from(bytes.subarray(offset + 4, offset + 8)).toString(
      "ascii"
    );
    if (type === "acTL") {
      return true;
    }
    if (type === "IDAT" || length > bytes.length - offset - 12) {
      return false;
    }
    offset += length + 12;
  }
  return false;
};

const validateRaster = async (
  input: MediaInput
): Promise<readonly BlogDiagnostic[]> => {
  const diagnostics: BlogDiagnostic[] = [];
  if (input.bytes.byteLength > RASTER_BYTE_LIMIT) {
    diagnostics.push(
      diagnostic(
        input,
        "blog/media-raster-byte-limit",
        "The raster image exceeds the 10 MiB source-size ceiling.",
        "Reduce the file to at most 10 MiB.",
        { actual: input.bytes.byteLength, allowed: RASTER_BYTE_LIMIT }
      )
    );
    return diagnostics;
  }

  const expected =
    input.extension === ".jpg" ? "jpeg" : input.extension.slice(1);
  const detected = detectedRasterFormat(input.bytes);
  if (detected !== expected) {
    diagnostics.push(
      diagnostic(
        input,
        "blog/media-raster-format",
        "The file signature does not match its lowercase extension.",
        "Export the image in the format named by its extension.",
        { detected: detected ?? "unknown", expected }
      )
    );
    return diagnostics;
  }

  if (detected === "png" && hasApngAnimation(input.bytes)) {
    diagnostics.push(
      diagnostic(
        input,
        "blog/media-animation",
        "Animated PNG images are not supported.",
        "Replace the file with a single-frame still image."
      )
    );
    return diagnostics;
  }

  try {
    const image = sharp(input.bytes, {
      failOn: "warning",
      limitInputPixels: PIXEL_LIMIT,
      unlimited: false,
    });
    const metadata = await image.metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    const pageCount = metadata.pages ?? 1;
    const decodedFormat = metadata.format === "heif" ? "avif" : metadata.format;
    const animated =
      pageCount !== 1 ||
      metadata.delay !== undefined ||
      metadata.loop !== undefined;

    if (animated) {
      diagnostics.push(
        diagnostic(
          input,
          "blog/media-animation",
          "Animated or multi-frame images are not supported.",
          "Replace the file with a single-frame still image.",
          { pages: pageCount }
        )
      );
    }
    if (decodedFormat !== expected) {
      diagnostics.push(
        diagnostic(
          input,
          "blog/media-raster-format",
          "The decoded image format does not match its lowercase extension.",
          "Export the image in the format named by its extension.",
          { decoded: decodedFormat ?? "unknown", expected }
        )
      );
    }
    if (
      width <= 0 ||
      height <= 0 ||
      width > DIMENSION_LIMIT ||
      height > DIMENSION_LIMIT ||
      width * height > PIXEL_LIMIT
    ) {
      diagnostics.push(
        diagnostic(
          input,
          "blog/media-raster-dimensions",
          "Raster dimensions must be positive, no axis may exceed 8,192 pixels, and the image may not exceed 40 megapixels.",
          "Resize the image within all dimension ceilings.",
          {
            actual: { width, height, pixels: width * height },
            allowed: {
              maximumAxis: DIMENSION_LIMIT,
              maximumPixels: PIXEL_LIMIT,
            },
          }
        )
      );
    }
    if (diagnostics.length === 0) {
      await image.stats();
    }
  } catch (error) {
    diagnostics.push(
      diagnostic(
        input,
        "blog/media-raster-decode",
        "The raster image could not be decoded completely.",
        "Re-export or replace the corrupt image.",
        error instanceof Error ? error.message : String(error)
      )
    );
  }
  return diagnostics;
};

const validateSvg = (input: MediaInput): readonly BlogDiagnostic[] => {
  const diagnostics: BlogDiagnostic[] = [];
  if (input.bytes.byteLength > SVG_BYTE_LIMIT) {
    return [
      diagnostic(
        input,
        "blog/media-svg-byte-limit",
        "The SVG exceeds the 1 MiB source-size ceiling.",
        "Reduce the SVG source to at most 1 MiB.",
        { actual: input.bytes.byteLength, allowed: SVG_BYTE_LIMIT }
      ),
    ];
  }

  const sourceText = Buffer.from(input.bytes).toString("utf-8");
  if (/<!DOCTYPE|<!ENTITY/iu.test(sourceText)) {
    return [
      diagnostic(
        input,
        "blog/media-svg-entity",
        "SVG document types and entity declarations are forbidden.",
        "Remove the DTD or entity declaration."
      ),
    ];
  }

  const parseFailures: string[] = [];
  let document: XmlDocument | undefined;
  try {
    document = new DOMParser({
      onError: (_level, message) => {
        parseFailures.push(message);
      },
    }).parseFromString(sourceText, "image/svg+xml");
  } catch (error) {
    parseFailures.push(error instanceof Error ? error.message : String(error));
    document = undefined;
  }
  if (parseFailures.length > 0 || document === undefined) {
    return [
      diagnostic(
        input,
        "blog/media-svg-xml",
        "The SVG is not well-formed XML.",
        "Correct the XML syntax.",
        parseFailures
      ),
    ];
  }

  const root = document.documentElement;
  if (
    document.doctype !== null ||
    root === null ||
    root.localName !== "svg" ||
    root.namespaceURI !== SVG_NAMESPACE
  ) {
    diagnostics.push(
      diagnostic(
        input,
        "blog/media-svg-root",
        "An SVG must have exactly one svg root in the SVG namespace.",
        'Use <svg xmlns="http://www.w3.org/2000/svg"> as the document root.'
      )
    );
    return diagnostics;
  }

  const dimensions = ["width", "height"].map((name) =>
    Number(root.getAttribute(name))
  );
  const viewBox = (root.getAttribute("viewBox") ?? "")
    .trim()
    .split(/[\s,]+/u)
    .map(Number);
  if (
    dimensions.some((value) => !Number.isFinite(value) || value <= 0) ||
    viewBox.length !== 4 ||
    viewBox.some((value) => !Number.isFinite(value)) ||
    viewBox[2] <= 0 ||
    viewBox[3] <= 0
  ) {
    diagnostics.push(
      diagnostic(
        input,
        "blog/media-svg-dimensions",
        "SVGs require finite positive numeric width and height plus a valid four-number viewBox.",
        "Add intrinsic dimensions and a positive viewBox.",
        {
          width: root.getAttribute("width"),
          height: root.getAttribute("height"),
          viewBox: root.getAttribute("viewBox"),
        },
        root.lineNumber,
        root.columnNumber
      )
    );
  }

  const ids = new Set<string>();
  const references: {
    readonly id: string;
    readonly line?: number;
    readonly column?: number;
  }[] = [];
  const stack: { readonly node: XmlNode; readonly depth: number }[] = [
    { node: document, depth: 0 },
  ];
  let nodeCount = 0;

  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) {
      break;
    }
    nodeCount += 1;
    if (nodeCount > 10_000 || current.depth > 100) {
      diagnostics.push(
        diagnostic(
          input,
          "blog/media-svg-complexity",
          "The SVG exceeds the 10,000-node or 100-level safety ceiling.",
          "Simplify or flatten the SVG."
        )
      );
      break;
    }

    const { node } = current;
    if (
      node.nodeType === node.DOCUMENT_TYPE_NODE ||
      node.nodeType === node.ENTITY_NODE ||
      node.nodeType === node.ENTITY_REFERENCE_NODE ||
      node.nodeType === node.PROCESSING_INSTRUCTION_NODE
    ) {
      diagnostics.push(
        diagnostic(
          input,
          "blog/media-svg-node",
          "The SVG contains a forbidden XML node.",
          "Remove processing instructions, entities, and document types.",
          node.nodeName,
          node.lineNumber,
          node.columnNumber
        )
      );
    }

    if (isXmlElement(node, node.ELEMENT_NODE)) {
      const element = node;
      const line = element.lineNumber;
      const column = element.columnNumber;
      if (
        element.namespaceURI !== SVG_NAMESPACE ||
        !SVG_ELEMENTS.has(element.localName ?? "")
      ) {
        diagnostics.push(
          diagnostic(
            input,
            "blog/media-svg-element",
            "The SVG contains an element outside the reviewed static vocabulary.",
            "Use only static SVG shapes, text, gradients, masks, filters, symbols, and grouping elements.",
            element.tagName,
            line,
            column
          )
        );
      }

      for (let index = 0; index < element.attributes.length; index += 1) {
        const attribute = element.attributes.item(index);
        if (attribute === null) {
          continue;
        }
        const { name, value: rawValue } = attribute;
        const value = rawValue.trim();
        if (
          name === "style" ||
          name.toLowerCase().startsWith("on") ||
          !SVG_ATTRIBUTES.has(name)
        ) {
          diagnostics.push(
            diagnostic(
              input,
              "blog/media-svg-attribute",
              "The SVG contains an attribute outside the reviewed static vocabulary.",
              "Remove styles, event handlers, and unsupported attributes.",
              name,
              line,
              column
            )
          );
          continue;
        }
        if (name === "font-family" && /url\s*\(/iu.test(value)) {
          diagnostics.push(
            diagnostic(
              input,
              "blog/media-svg-external-resource",
              "SVG fonts and external resources are forbidden.",
              "Use ordinary local presentation attributes without external resources.",
              value,
              line,
              column
            )
          );
        }
        if (name === "href" || name === "xlink:href") {
          if (/^#[A-Za-z_][\w:.-]*$/u.test(value)) {
            references.push({ id: value.slice(1), line, column });
          } else {
            diagnostics.push(
              diagnostic(
                input,
                "blog/media-svg-reference",
                "SVG href values must be local fragment references.",
                'Use a local reference such as "#shape".',
                value,
                line,
                column
              )
            );
          }
          continue;
        }
        for (const match of value.matchAll(/url\s*\(\s*([^)]*?)\s*\)/giu)) {
          const target = match[1]?.replaceAll(/^["']|["']$/gu, "");
          if (target === undefined || !/^#[A-Za-z_][\w:.-]*$/u.test(target)) {
            diagnostics.push(
              diagnostic(
                input,
                "blog/media-svg-external-resource",
                "SVG URL values must be local fragment references.",
                'Use url("#id") or remove the resource reference.',
                value,
                line,
                column
              )
            );
          } else {
            references.push({ id: target.slice(1), line, column });
          }
        }
        if (name === "id") {
          if (!/^[A-Za-z_][\w:.-]*$/u.test(value)) {
            diagnostics.push(
              diagnostic(
                input,
                "blog/media-svg-id",
                "SVG IDs must be non-empty XML-style identifiers.",
                "Rename the ID using letters, digits, underscores, colons, periods, or hyphens.",
                value,
                line,
                column
              )
            );
          }
          if (ids.has(value)) {
            diagnostics.push(
              diagnostic(
                input,
                "blog/media-svg-duplicate-id",
                "SVG IDs must be unique.",
                "Rename one of the duplicate IDs and update its references.",
                value,
                line,
                column
              )
            );
          }
          ids.add(value);
        }
      }
    }

    for (
      let child = node.lastChild;
      child !== null;
      child = child.previousSibling
    ) {
      stack.push({ node: child, depth: current.depth + 1 });
    }
  }

  for (const reference of references) {
    if (!ids.has(reference.id)) {
      diagnostics.push(
        diagnostic(
          input,
          "blog/media-svg-unresolved-reference",
          "The SVG references an ID that does not exist.",
          "Add the referenced ID or remove the local reference.",
          reference.id,
          reference.line,
          reference.column
        )
      );
    }
  }
  return diagnostics;
};

export const validateMedia = async (
  input: MediaInput
): Promise<readonly BlogDiagnostic[]> =>
  input.extension === ".svg" ? validateSvg(input) : await validateRaster(input);
