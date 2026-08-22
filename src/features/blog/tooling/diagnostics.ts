export interface BlogDiagnostic {
  readonly ruleId: string;
  readonly source: string;
  readonly articleSlug?: string;
  readonly line?: number;
  readonly column?: number;
  readonly value?: unknown;
  readonly explanation: string;
  readonly guidance: string;
}

export const compareLexically = (left: string, right: string): number => {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
};

export const sortBlogDiagnostics = (
  diagnostics: readonly BlogDiagnostic[]
): readonly BlogDiagnostic[] =>
  diagnostics.toSorted(
    (left, right) =>
      compareLexically(left.source, right.source) ||
      (left.line ?? 0) - (right.line ?? 0) ||
      (left.column ?? 0) - (right.column ?? 0) ||
      compareLexically(left.ruleId, right.ruleId) ||
      compareLexically(JSON.stringify(left.value), JSON.stringify(right.value))
  );

const representValue = (value: unknown): string => {
  try {
    const represented = JSON.stringify(value);
    return represented ?? String(value);
  } catch {
    return "[unrepresentable value]";
  }
};

const representSource = (source: string): string =>
  Array.from(source, (character) => {
    const code = character.codePointAt(0) ?? 0;
    return code <= 0x1f || (code >= 0x7f && code <= 0x9f)
      ? `\\u${code.toString(16).padStart(4, "0")}`
      : character;
  }).join("");

export const renderBlogDiagnostics = (
  diagnostics: readonly BlogDiagnostic[]
): string => {
  const sorted = sortBlogDiagnostics(diagnostics);
  const noun = sorted.length === 1 ? "failure" : "failures";
  const rendered = sorted.map((diagnostic) => {
    const safeSource = representSource(diagnostic.source);
    let location = safeSource;
    if (diagnostic.line !== undefined) {
      location = `${safeSource}:${diagnostic.line}:${diagnostic.column ?? 1}`;
    }
    const article =
      diagnostic.articleSlug === undefined
        ? ""
        : ` [Article ${representValue(diagnostic.articleSlug)}]`;
    const value =
      diagnostic.value === undefined
        ? ""
        : `\n  Offending value: ${representValue(diagnostic.value)}`;

    return `${location} [${diagnostic.ruleId}]${article}\n  ${diagnostic.explanation}${value}\n  Fix: ${diagnostic.guidance}`;
  });

  return `Blog validation failed with ${sorted.length} ${noun}:\n\n${rendered.join("\n\n")}`;
};

export class BlogValidationError extends Error {
  readonly diagnostics: readonly BlogDiagnostic[];

  constructor(diagnostics: readonly BlogDiagnostic[]) {
    const sorted = sortBlogDiagnostics(diagnostics);
    super(renderBlogDiagnostics(sorted));
    this.name = "BlogValidationError";
    this.diagnostics = sorted;
  }
}
