import path from "node:path";
import process from "node:process";

import { BlogValidationError } from "./diagnostics.ts";
import {
  checkArticleManifest,
  generateArticleManifest,
  watchArticleSource,
} from "./source-manifest.ts";
import type { BlogToolPaths } from "./source-manifest.ts";

const repositoryRoot = process.cwd();
const paths: BlogToolPaths = {
  repositoryRoot,
  articlesRoot: path.join(repositoryRoot, "src/features/blog/content"),
  manifestPath: path.join(
    repositoryRoot,
    "src/features/blog/articles/manifest.generated.ts"
  ),
};

const reportGeneration = (result: { readonly changed: boolean }): void => {
  if (result.changed) {
    process.stdout.write("Regenerated the Article manifest.\n");
  }
};

const runWatch = async (): Promise<void> => {
  const controller = new AbortController();
  const stop = (): void => {
    controller.abort();
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  await watchArticleSource(paths, {
    signal: controller.signal,
    onGeneration: reportGeneration,
    onError: (error) => {
      process.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`
      );
    },
  });
};

const generateManifestCommand = async (): Promise<void> => {
  const result = await generateArticleManifest(paths);
  process.stdout.write(
    result.changed
      ? `Generated ${path.relative(repositoryRoot, paths.manifestPath)}.\n`
      : "Article manifest is already current.\n"
  );
};

const checkManifestCommand = async (): Promise<void> => {
  await checkArticleManifest(paths);
  process.stdout.write("Article source bundles and manifest are valid.\n");
};

const COMMANDS = new Map<string, () => Promise<void>>([
  ["generate", generateManifestCommand],
  ["check", checkManifestCommand],
  ["watch", runWatch],
]);

const main = async (): Promise<void> => {
  const run = COMMANDS.get(process.argv.at(2) ?? "");
  if (run === undefined) {
    throw new Error("Expected one of: generate, check, watch.");
  }
  await run();
};

try {
  await main();
} catch (error) {
  process.stderr.write(
    `${error instanceof BlogValidationError || error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
}
