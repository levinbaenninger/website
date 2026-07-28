import {
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
} from "node:fs/promises";
import path from "node:path";
import { setTimeout as wait } from "node:timers/promises";

import { BlogValidationError, compareLexically } from "./diagnostics.mts";
import type { BlogDiagnostic } from "./diagnostics.mts";
import { validateMedia } from "./media.mts";

const SUPPORTED_EXTENSIONS = new Set([
  ".avif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);
const RASTER_EXTENSIONS = new Set([".avif", ".jpeg", ".jpg", ".png", ".webp"]);
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const IMPORT_PATTERN =
  /^[\t ]*import(?:[\t \r\n]+[\s\S]*?[\t \r\n]+from)?[\t \r\n]*["']([^"'\r\n]+)["'][\t ]*;?/gmu;

export interface ArticleAsset {
  readonly relativePath: string;
  readonly absolutePath: string;
  readonly extension: string;
  readonly isCover: boolean;
}

export interface ArticleBundle {
  readonly slug: string;
  readonly mdxPath: string;
  readonly sourcePath: string;
  readonly cover: ArticleAsset;
  readonly assets: readonly ArticleAsset[];
}

export interface BlogToolPaths {
  readonly repositoryRoot: string;
  readonly articlesRoot: string;
  readonly manifestPath: string;
}

export interface BlogGenerationResult {
  readonly changed: boolean;
  readonly manifest: string;
  readonly bundles: readonly ArticleBundle[];
}

export interface BlogWatchOptions {
  readonly signal: AbortSignal;
  readonly intervalMilliseconds?: number;
  readonly onGeneration?: (result: BlogGenerationResult) => void;
  readonly onError?: (error: unknown) => void;
}

const toSource = (repositoryRoot: string, absolutePath: string): string =>
  path.relative(repositoryRoot, absolutePath).split(path.sep).join("/");

const createDiagnostic = (
  source: string,
  ruleId: string,
  explanation: string,
  guidance: string,
  options: {
    readonly articleSlug?: string;
    readonly value?: unknown;
    readonly line?: number;
    readonly column?: number;
  } = {}
): BlogDiagnostic => ({
  source,
  ruleId,
  explanation,
  guidance,
  ...options,
});

const isValidSegment = (segment: string): boolean =>
  segment.length >= 1 && segment.length <= 80 && NAME_PATTERN.test(segment);

const validateAssetName = (
  relativePath: string,
  source: string,
  slug: string
): readonly BlogDiagnostic[] => {
  const diagnostics: BlogDiagnostic[] = [];
  const segments = relativePath.split("/");
  const filename = segments.at(-1) ?? "";
  const extension = path.posix.extname(filename);
  const basename = filename.slice(0, -extension.length);
  const directorySegments = segments.slice(0, -1);

  if (relativePath.length > 240) {
    diagnostics.push(
      createDiagnostic(
        source,
        "blog/path-length",
        "The path under assets exceeds 240 characters.",
        "Shorten the directory or file names.",
        { articleSlug: slug, value: relativePath }
      )
    );
  }
  for (const segment of [...directorySegments, basename]) {
    if (!isValidSegment(segment)) {
      diagnostics.push(
        createDiagnostic(
          source,
          "blog/path-name",
          "Asset path segments must be lowercase ASCII kebab case and 1–80 characters.",
          "Rename the segment using lowercase letters, digits, and single hyphens.",
          { articleSlug: slug, value: segment }
        )
      );
    }
  }
  if (
    extension !== extension.toLowerCase() ||
    !SUPPORTED_EXTENSIONS.has(extension)
  ) {
    diagnostics.push(
      createDiagnostic(
        source,
        "blog/path-extension",
        "Article assets must use one supported lowercase still-image extension.",
        "Use .avif, .webp, .png, .jpg, .jpeg, or .svg.",
        { articleSlug: slug, value: extension }
      )
    );
  }
  if (basename.includes(".")) {
    diagnostics.push(
      createDiagnostic(
        source,
        "blog/path-multiple-suffixes",
        "Multi-suffix and ambiguous asset filenames are not supported.",
        "Use exactly one extension after a lowercase kebab-case basename.",
        { articleSlug: slug, value: filename }
      )
    );
  }
  return diagnostics;
};

interface WalkResult {
  readonly files: readonly string[];
  readonly diagnostics: readonly BlogDiagnostic[];
}

const walkAssets = async (
  absoluteDirectory: string,
  relativeDirectory: string,
  repositoryRoot: string,
  slug: string
): Promise<WalkResult> => {
  const files: string[] = [];
  const diagnostics: BlogDiagnostic[] = [];
  const entries = (await readdir(absoluteDirectory)).toSorted((left, right) =>
    compareLexically(left, right)
  );

  for (const name of entries) {
    const absolutePath = path.join(absoluteDirectory, name);
    const relativePath =
      relativeDirectory === "" ? name : `${relativeDirectory}/${name}`;
    const source = toSource(repositoryRoot, absolutePath);
    const stats = await lstat(absolutePath);

    if (stats.isSymbolicLink()) {
      diagnostics.push(
        createDiagnostic(
          source,
          "blog/path-symlink",
          "Symlinks are forbidden in Article source bundles.",
          "Replace the symlink with an Article-owned regular file or directory.",
          { articleSlug: slug, value: relativePath }
        )
      );
      continue;
    }
    if (name.startsWith(".")) {
      diagnostics.push(
        createDiagnostic(
          source,
          "blog/path-hidden",
          "Hidden files and directories are forbidden in Article source bundles.",
          "Remove the hidden entry from the bundle.",
          { articleSlug: slug, value: relativePath }
        )
      );
    }
    if (stats.isDirectory()) {
      if (!isValidSegment(name)) {
        diagnostics.push(
          createDiagnostic(
            source,
            "blog/path-name",
            "Asset directory names must be lowercase ASCII kebab case and 1–80 characters.",
            "Rename the directory using lowercase letters, digits, and single hyphens.",
            { articleSlug: slug, value: name }
          )
        );
      }
      const nested = await walkAssets(
        absolutePath,
        relativePath,
        repositoryRoot,
        slug
      );
      files.push(...nested.files);
      diagnostics.push(...nested.diagnostics);
    } else if (stats.isFile()) {
      files.push(relativePath);
      diagnostics.push(...validateAssetName(relativePath, source, slug));
    } else {
      diagnostics.push(
        createDiagnostic(
          source,
          "blog/path-file-type",
          "Only regular files and directories are supported in Article bundles.",
          "Remove the special filesystem entry.",
          { articleSlug: slug, value: relativePath }
        )
      );
    }
  }

  return { files, diagnostics };
};

const findLineAndColumn = (
  source: string,
  offset: number
): { readonly line: number; readonly column: number } => {
  const before = source.slice(0, offset);
  const lines = before.split("\n");
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
};

const validateArticleImports = (
  mdxSource: string,
  mdxSourcePath: string,
  slug: string,
  assets: readonly ArticleAsset[]
): readonly BlogDiagnostic[] => {
  const diagnostics: BlogDiagnostic[] = [];
  const knownAssets = new Set(assets.map(({ relativePath }) => relativePath));
  const importedAssets = new Set<string>();

  for (const match of mdxSource.matchAll(IMPORT_PATTERN)) {
    const specifier = match[1] ?? "";
    const location = findLineAndColumn(
      mdxSource,
      (match.index ?? 0) + match[0].indexOf(specifier)
    );
    const options = {
      articleSlug: slug,
      value: specifier,
      ...location,
    };
    if (path.posix.isAbsolute(specifier) || path.win32.isAbsolute(specifier)) {
      diagnostics.push(
        createDiagnostic(
          mdxSourcePath,
          "blog/import-absolute",
          "Article-local imports cannot use absolute paths.",
          'Import an owned image from "./assets/...".',
          options
        )
      );
      continue;
    }
    if (!specifier.startsWith(".")) {
      continue;
    }
    if (specifier.includes("?") || specifier.includes("#")) {
      diagnostics.push(
        createDiagnostic(
          mdxSourcePath,
          "blog/import-suffix",
          "Article-local asset imports cannot contain query strings or fragments.",
          "Import the exact image filename without a suffix.",
          options
        )
      );
      continue;
    }
    const segments = specifier.split("/");
    if (segments.includes("..")) {
      diagnostics.push(
        createDiagnostic(
          mdxSourcePath,
          "blog/import-traversal",
          "Article-local imports cannot traverse outside their bundle.",
          'Import an owned image from "./assets/...".',
          options
        )
      );
      continue;
    }
    if (!specifier.startsWith("./assets/")) {
      diagnostics.push(
        createDiagnostic(
          mdxSourcePath,
          "blog/import-cross-article",
          "Article-authored local imports must resolve inside the same Article's assets directory.",
          'Move the image into this bundle and import it from "./assets/...".',
          options
        )
      );
      continue;
    }
    const relativePath = specifier.slice("./assets/".length);
    if (!knownAssets.has(relativePath)) {
      diagnostics.push(
        createDiagnostic(
          mdxSourcePath,
          "blog/import-missing",
          "The imported Article asset does not exist with this exact case-sensitive path.",
          "Correct the path or add the supported image file.",
          options
        )
      );
      continue;
    }

    if (importedAssets.has(relativePath)) {
      diagnostics.push(
        createDiagnostic(
          mdxSourcePath,
          "blog/import-duplicate",
          "An Article-local asset may be imported only once.",
          "Reuse the first imported binding in every approved media position.",
          options
        )
      );
      continue;
    }
    importedAssets.add(relativePath);
  }

  for (const asset of assets) {
    if (
      !asset.isCover &&
      SUPPORTED_EXTENSIONS.has(asset.extension) &&
      !importedAssets.has(asset.relativePath)
    ) {
      diagnostics.push(
        createDiagnostic(
          mdxSourcePath,
          "blog/asset-orphan",
          "Every non-Cover Article asset must be imported by its owning Article.",
          "Import and consume the asset in a Figure, or remove it from the source bundle.",
          {
            articleSlug: slug,
            value: asset.relativePath,
          }
        )
      );
    }
  }
  return diagnostics;
};

const inspectBundle = async (
  paths: BlogToolPaths,
  slug: string
): Promise<{
  readonly bundle?: ArticleBundle;
  readonly diagnostics: readonly BlogDiagnostic[];
}> => {
  const diagnostics: BlogDiagnostic[] = [];
  const bundleDirectory = path.join(paths.articlesRoot, slug);
  const bundleSource = toSource(paths.repositoryRoot, bundleDirectory);
  const bundleStats = await lstat(bundleDirectory);

  if (bundleStats.isSymbolicLink()) {
    return {
      diagnostics: [
        createDiagnostic(
          bundleSource,
          "blog/path-symlink",
          "Article source bundles cannot be symlinks.",
          "Replace the symlink with an Article-owned directory.",
          { articleSlug: slug, value: slug }
        ),
      ],
    };
  }
  if (!bundleStats.isDirectory()) {
    return {
      diagnostics: [
        createDiagnostic(
          bundleSource,
          "blog/bundle-directory",
          "Every entry directly under the Article source root must be a bundle directory.",
          "Move the entry into a valid Article source bundle or remove it.",
          { value: slug }
        ),
      ],
    };
  }
  if (!isValidSegment(slug)) {
    diagnostics.push(
      createDiagnostic(
        bundleSource,
        "blog/bundle-slug",
        "Article bundle names must be lowercase ASCII kebab-case slugs of 1–80 characters.",
        "Rename the bundle and its matching MDX file.",
        { articleSlug: slug, value: slug }
      )
    );
  }

  const entries = (await readdir(bundleDirectory)).toSorted((left, right) =>
    compareLexically(left, right)
  );
  const expectedMdx = `${slug}.mdx`;
  const allowed = new Set([expectedMdx, "assets"]);
  for (const entry of entries) {
    if (!allowed.has(entry)) {
      diagnostics.push(
        createDiagnostic(
          toSource(paths.repositoryRoot, path.join(bundleDirectory, entry)),
          "blog/bundle-shape",
          "An Article source bundle is closed and may contain only its matching MDX file and assets directory.",
          `Keep only ${JSON.stringify(expectedMdx)} and "assets" at the bundle root.`,
          { articleSlug: slug, value: entry }
        )
      );
    }
  }

  const mdxPath = path.join(bundleDirectory, expectedMdx);
  const assetsDirectory = path.join(bundleDirectory, "assets");
  let requiredEntriesValid = true;
  for (const [requiredPath, ruleId, explanation, guidance] of [
    [
      mdxPath,
      "blog/bundle-mdx",
      "The Article bundle is missing its filename-matched MDX source.",
      `Add ${JSON.stringify(expectedMdx)} at the bundle root.`,
    ],
    [
      assetsDirectory,
      "blog/bundle-assets",
      "Every Article bundle requires an assets directory.",
      'Add an "assets" directory containing exactly one Cover image.',
    ],
  ] as const) {
    try {
      const stats = await lstat(requiredPath);
      if (
        stats.isSymbolicLink() ||
        (requiredPath === mdxPath ? !stats.isFile() : !stats.isDirectory())
      ) {
        requiredEntriesValid = false;
        diagnostics.push(
          createDiagnostic(
            toSource(paths.repositoryRoot, requiredPath),
            "blog/path-symlink",
            "Required Article bundle entries must be real files or directories, not symlinks.",
            "Replace the symlink or special entry with the required owned entry.",
            { articleSlug: slug }
          )
        );
      }
    } catch {
      requiredEntriesValid = false;
      diagnostics.push(
        createDiagnostic(
          toSource(paths.repositoryRoot, requiredPath),
          ruleId,
          explanation,
          guidance,
          { articleSlug: slug }
        )
      );
    }
  }

  if (!requiredEntriesValid) {
    return { diagnostics };
  }

  const walked = await walkAssets(
    assetsDirectory,
    "",
    paths.repositoryRoot,
    slug
  );
  diagnostics.push(...walked.diagnostics);
  const assets = walked.files
    .map((relativePath): ArticleAsset => {
      const absolutePath = path.join(assetsDirectory, relativePath);
      const extension = path.posix.extname(relativePath);
      return {
        relativePath,
        absolutePath,
        extension,
        isCover:
          !relativePath.includes("/") &&
          relativePath.slice(0, -extension.length) === "cover" &&
          SUPPORTED_EXTENSIONS.has(extension),
      };
    })
    .toSorted((left, right) =>
      compareLexically(left.relativePath, right.relativePath)
    );
  const covers = assets.filter(({ isCover }) => isCover);
  if (covers.length !== 1) {
    diagnostics.push(
      createDiagnostic(
        toSource(paths.repositoryRoot, assetsDirectory),
        "blog/cover-count",
        "Every Article requires exactly one case-sensitive assets/cover image in a supported format.",
        "Keep exactly one cover.avif, cover.webp, cover.png, cover.jpg, cover.jpeg, or cover.svg.",
        {
          articleSlug: slug,
          value: covers.map(({ relativePath }) => relativePath),
        }
      )
    );
  }

  for (const asset of assets) {
    if (!SUPPORTED_EXTENSIONS.has(asset.extension)) {
      continue;
    }
    const bytes = await readFile(asset.absolutePath);
    diagnostics.push(
      ...(await validateMedia({
        absolutePath: asset.absolutePath,
        source: toSource(paths.repositoryRoot, asset.absolutePath),
        articleSlug: slug,
        extension: asset.extension,
        bytes,
      }))
    );
  }

  const mdxSource = await readFile(mdxPath, "utf-8");
  diagnostics.push(
    ...validateArticleImports(
      mdxSource,
      toSource(paths.repositoryRoot, mdxPath),
      slug,
      assets
    )
  );

  return {
    diagnostics,
    bundle:
      covers[0] === undefined
        ? undefined
        : {
            slug,
            mdxPath,
            sourcePath: toSource(paths.repositoryRoot, mdxPath),
            cover: covers[0],
            assets,
          },
  };
};

export const inspectArticleSource = async (
  paths: BlogToolPaths
): Promise<readonly ArticleBundle[]> => {
  const diagnostics: BlogDiagnostic[] = [];
  let entries: string[];
  try {
    entries = (await readdir(paths.articlesRoot)).toSorted((left, right) =>
      compareLexically(left, right)
    );
  } catch {
    throw new BlogValidationError([
      createDiagnostic(
        toSource(paths.repositoryRoot, paths.articlesRoot),
        "blog/articles-root",
        "The Article source root is missing or unreadable.",
        "Create the configured Article source directory."
      ),
    ]);
  }

  const inspections = await Promise.all(
    entries.map(async (entry) => await inspectBundle(paths, entry))
  );
  const bundles: ArticleBundle[] = [];
  for (const inspection of inspections) {
    diagnostics.push(...inspection.diagnostics);
    if (inspection.bundle !== undefined) {
      bundles.push(inspection.bundle);
    }
  }
  if (diagnostics.length > 0) {
    throw new BlogValidationError(diagnostics);
  }
  return bundles.toSorted((left, right) =>
    compareLexically(left.slug, right.slug)
  );
};

const coverImportIdentifier = (slug: string): string =>
  `cover_${slug.replaceAll("-", "_")}`;

export const renderArticleManifest = (
  paths: BlogToolPaths,
  bundles: readonly ArticleBundle[]
): string => {
  const manifestDirectory = path.dirname(paths.manifestPath);
  const imports = bundles.map((bundle) => {
    const importPath = path
      .relative(manifestDirectory, bundle.cover.absolutePath)
      .split(path.sep)
      .join("/");
    return `import ${coverImportIdentifier(bundle.slug)} from ${JSON.stringify(importPath.startsWith(".") ? importPath : `./${importPath}`)};`;
  });
  const entries = bundles.map((bundle) => {
    const mdxImport = path
      .relative(manifestDirectory, bundle.mdxPath)
      .split(path.sep)
      .join("/");
    const specifier = mdxImport.startsWith(".") ? mdxImport : `./${mdxImport}`;
    return `  {
    slug: ${JSON.stringify(bundle.slug)},
    loadArticle: () =>
      import(
        ${JSON.stringify(specifier)}
      ),
    cover: ${coverImportIdentifier(bundle.slug)},
  },`;
  });
  const importBlock = imports.length === 0 ? "" : `${imports.join("\n")}\n`;

  return `// Generated deterministically. Do not edit by hand.

${importBlock}import type { ArticleManifestEntry } from "./article-collection";

export const ARTICLE_MANIFEST = [
${entries.join("\n")}
] as const satisfies readonly ArticleManifestEntry[];
`;
};

const atomicWrite = async (
  targetPath: string,
  content: string
): Promise<void> => {
  await mkdir(path.dirname(targetPath), { recursive: true });
  const temporaryPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;
  try {
    const file = await open(temporaryPath, "wx");
    try {
      await file.writeFile(content, "utf-8");
      await file.sync();
    } finally {
      await file.close();
    }
    await rename(temporaryPath, targetPath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
};

export const generateArticleManifest = async (
  paths: BlogToolPaths
): Promise<BlogGenerationResult> => {
  const bundles = await inspectArticleSource(paths);
  const manifest = renderArticleManifest(paths, bundles);
  let previous: string | undefined;
  try {
    previous = await readFile(paths.manifestPath, "utf-8");
  } catch {
    previous = undefined;
  }
  const changed = previous !== manifest;
  if (changed) {
    await atomicWrite(paths.manifestPath, manifest);
  }
  return { changed, manifest, bundles };
};

export const checkArticleManifest = async (
  paths: BlogToolPaths
): Promise<BlogGenerationResult> => {
  const bundles = await inspectArticleSource(paths);
  const manifest = renderArticleManifest(paths, bundles);
  let committed: string | undefined;
  try {
    committed = await readFile(paths.manifestPath, "utf-8");
  } catch {
    committed = undefined;
  }
  if (committed !== manifest) {
    throw new BlogValidationError([
      createDiagnostic(
        toSource(paths.repositoryRoot, paths.manifestPath),
        "blog/manifest-drift",
        "The committed Article manifest does not match the validated source bundles.",
        "Run `vp run blog:generate` and commit the resulting manifest."
      ),
    ]);
  }
  return { changed: false, manifest, bundles };
};

const snapshotArticleSource = async (articlesRoot: string): Promise<string> => {
  const entries: string[] = [];
  const visit = async (absoluteDirectory: string): Promise<void> => {
    const names = (await readdir(absoluteDirectory)).toSorted(compareLexically);
    for (const name of names) {
      const absolutePath = path.join(absoluteDirectory, name);
      const relativePath = path.relative(articlesRoot, absolutePath);
      const metadata = await lstat(absolutePath);
      let kind = "f";
      if (metadata.isSymbolicLink()) {
        kind = "l";
      } else if (metadata.isDirectory()) {
        kind = "d";
      }
      entries.push(
        `${relativePath}\0${kind}\0${metadata.size}\0${metadata.mtimeMs}`
      );
      if (metadata.isDirectory() && !metadata.isSymbolicLink()) {
        await visit(absolutePath);
      }
    }
  };
  await visit(articlesRoot);
  return entries.join("\n");
};

export const watchArticleSource = async (
  paths: BlogToolPaths,
  options: BlogWatchOptions
): Promise<void> => {
  let previous = await snapshotArticleSource(paths.articlesRoot);
  while (!options.signal.aborted) {
    await wait(options.intervalMilliseconds ?? 250);
    let current: string;
    try {
      current = await snapshotArticleSource(paths.articlesRoot);
    } catch (error) {
      current = `unreadable:${error instanceof Error ? error.message : String(error)}`;
    }
    if (current === previous) {
      continue;
    }
    previous = current;
    try {
      const result = await generateArticleManifest(paths);
      options.onGeneration?.(result);
    } catch (error) {
      options.onError?.(error);
    }
  }
};

export const isRasterExtension = (extension: string): boolean =>
  RASTER_EXTENSIONS.has(extension);
