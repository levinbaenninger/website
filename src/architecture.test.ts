import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import ts from "typescript";
import { expect, test } from "vite-plus/test";

const SOURCE_ROOT = path.resolve(process.cwd(), "src");
const SOURCE_EXTENSIONS = new Set([
  ".cjs",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
]);

interface SourceLocation {
  zone: "app" | "module" | "modules-root" | "shared" | "other";
  moduleName?: string;
  modulePath?: string[];
}

const collectSourceFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFilePromises: Promise<string[]>[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      nestedFilePromises.push(
        collectSourceFiles(path.join(directory, entry.name))
      );
    }
  }

  const nestedFiles = await Promise.all(nestedFilePromises);
  const localFiles = entries
    .filter(
      (entry) =>
        entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))
    )
    .map((entry) => path.join(directory, entry.name));

  return [...localFiles, ...nestedFiles.flat()];
};

const collectModuleSpecifiers = (file: string, source: string): string[] => {
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true
  );
  const specifiers: string[] = [];

  const visit = (node: ts.Node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }

    if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression !== undefined &&
      ts.isStringLiteral(node.moduleReference.expression)
    ) {
      specifiers.push(node.moduleReference.expression.text);
    }

    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "require")) &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return specifiers;
};

const resolveSourceImport = (
  importer: string,
  specifier: string
): string | undefined => {
  if (specifier.startsWith("@/")) {
    return path.join(SOURCE_ROOT, specifier.slice(2));
  }

  if (specifier.startsWith(".")) {
    return path.resolve(path.dirname(importer), specifier);
  }

  return undefined;
};

const locateSourcePath = (sourcePath: string): SourceLocation => {
  const relativePath = path.relative(SOURCE_ROOT, sourcePath);

  if (relativePath.startsWith("..")) {
    return { zone: "other" };
  }

  const [owner, moduleName, ...modulePath] = relativePath.split(path.sep);

  if (owner === "app") {
    return { zone: "app" };
  }

  if (owner === "shared") {
    return { zone: "shared" };
  }

  if (owner === "modules" && moduleName === undefined) {
    return { zone: "modules-root" };
  }

  if (owner === "modules" && moduleName) {
    return { zone: "module", moduleName, modulePath };
  }

  return { zone: "other" };
};

test("collects CommonJS and TypeScript import-equals dependencies", () => {
  const source = `
    const portfolio = require("@/modules/portfolio");
    import blog = require("@/modules/blog");
  `;

  expect(collectModuleSpecifiers("architecture-fixture.ts", source)).toEqual([
    "@/modules/portfolio",
    "@/modules/blog",
  ]);
});

test("treats the modules root as invalid rather than as an entrypoint", () => {
  expect(locateSourcePath(path.join(SOURCE_ROOT, "modules"))).toEqual({
    zone: "modules-root",
  });
});

test("source imports respect ownership boundaries", async () => {
  const sourceFiles = await collectSourceFiles(SOURCE_ROOT);
  const sources = await Promise.all(
    sourceFiles.map(async (importer) => ({
      importer,
      source: await readFile(importer, "utf-8"),
    }))
  );
  const violations: string[] = [];

  for (const { importer, source } of sources) {
    const importerLocation = locateSourcePath(importer);

    for (const specifier of collectModuleSpecifiers(importer, source)) {
      const importedPath = resolveSourceImport(importer, specifier);

      if (importedPath === undefined) {
        continue;
      }

      const importedLocation = locateSourcePath(importedPath);
      const importerName = path.relative(SOURCE_ROOT, importer);
      const dependency = `${importerName} imports ${specifier}`;

      if (importedLocation.zone === "modules-root") {
        violations.push(
          `${dependency}: imports must target a specific module entrypoint`
        );
        continue;
      }

      if (
        importerLocation.zone === "shared" &&
        (importedLocation.zone === "app" || importedLocation.zone === "module")
      ) {
        violations.push(
          `${dependency}: shared cannot depend on app or modules`
        );
      }

      if (
        importerLocation.zone === "module" &&
        importedLocation.zone === "app"
      ) {
        violations.push(`${dependency}: modules cannot depend on app`);
      }

      if (
        importerLocation.zone === "module" &&
        importedLocation.zone === "module" &&
        importerLocation.moduleName !== importedLocation.moduleName
      ) {
        violations.push(
          `${dependency}: product modules cannot depend on peers`
        );
      }

      const { modulePath } = importedLocation;
      const importsModuleInternals =
        importedLocation.zone === "module" &&
        modulePath !== undefined &&
        modulePath.length > 0 &&
        !(modulePath.length === 1 && modulePath[0] === "index");
      const isSameModule =
        importerLocation.zone === "module" &&
        importerLocation.moduleName === importedLocation.moduleName;

      if (importsModuleInternals && !isSameModule) {
        violations.push(
          `${dependency}: external consumers must use the module entrypoint`
        );
      }
    }
  }

  expect(violations).toEqual([]);
});
