import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

import { BlogValidationError } from "./diagnostics.mts";
import {
  checkArticleManifest,
  generateArticleManifest,
  watchArticleSource,
} from "./source-manifest.mts";
import type { BlogToolPaths } from "./source-manifest.mts";

const repositoryRoot = process.cwd();
const paths: BlogToolPaths = {
  repositoryRoot,
  articlesRoot: path.join(repositoryRoot, "src/modules/blog/articles"),
  manifestPath: path.join(
    repositoryRoot,
    "src/modules/blog/article-manifest.generated.ts"
  ),
};

const reportGeneration = (result: { readonly changed: boolean }): void => {
  if (result.changed) {
    process.stdout.write("Regenerated the Article manifest.\n");
  }
};

const runDevelopment = async (): Promise<void> => {
  await generateArticleManifest(paths);
  const controller = new AbortController();
  const next = spawn(
    process.execPath,
    [path.join(repositoryRoot, "node_modules/next/dist/bin/next"), "dev"],
    { stdio: "inherit" }
  );
  const stop = (): void => {
    controller.abort();
    next.kill("SIGTERM");
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  const watcher = watchArticleSource(paths, {
    signal: controller.signal,
    onGeneration: reportGeneration,
    onError: (error) => {
      process.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`
      );
    },
  });
  const exitCode = await new Promise<number>((resolve) => {
    next.once("exit", (code) => {
      resolve(code ?? 1);
    });
  });
  controller.abort();
  await watcher;
  process.exitCode = exitCode;
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
  if (command === "dev") {
    await runDevelopment();
    return;
  }
  throw new Error("Expected one of: generate, check, dev.");
};

try {
  await main();
} catch (error) {
  process.stderr.write(
    `${error instanceof BlogValidationError || error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
}
