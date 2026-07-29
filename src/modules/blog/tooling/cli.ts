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
  articlesRoot: path.join(repositoryRoot, "src/modules/blog/content"),
  manifestPath: path.join(
    repositoryRoot,
    "src/modules/blog/articles/manifest.generated.ts"
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

const main = async (): Promise<void> => {
  const command = process.argv.at(2);
  if (command === "generate") {
    const result = await generateArticleManifest(paths);
    process.stdout.write(
      result.changed
        ? `Generated ${path.relative(repositoryRoot, paths.manifestPath)}.\n`
        : "Article manifest is already current.\n"
    );
    return;
  }
  if (command === "check") {
    await checkArticleManifest(paths);
    process.stdout.write("Article source bundles and manifest are valid.\n");
    return;
  }
  if (command === "watch") {
    await runWatch();
    return;
  }
  throw new Error("Expected one of: generate, check, watch.");
};

try {
  await main();
} catch (error) {
  process.stderr.write(
    `${error instanceof BlogValidationError || error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
}
