import { readFileSync } from "node:fs";

import { describe, expect, test } from "vite-plus/test";

const interactionSource = readFileSync(
  new URL("../rendering/interactions.tsx", import.meta.url),
  "utf-8"
);
const registrySource = readFileSync(
  new URL("../index.ts", import.meta.url),
  "utf-8"
);
const articlesSource = readFileSync(
  new URL("index.ts", import.meta.url),
  "utf-8"
);
const searchSource = readFileSync(
  new URL("../search/index.ts", import.meta.url),
  "utf-8"
);

describe("Article server and client boundaries", () => {
  test("keeps the Article registry server-first", () => {
    expect(registrySource.startsWith('"use client"')).toBe(false);
    expect(interactionSource.startsWith('"use client";')).toBe(true);
  });

  test("guards Article operations at their dedicated server-only entrypoint", () => {
    expect(articlesSource.startsWith('import "server-only";')).toBe(true);
    expect(registrySource).not.toContain('"./articles"');
  });

  test("keeps server capabilities out of the interaction entrypoint", () => {
    const forbiddenSpecifiers = [
      '"./collection"',
      '"./manifest.generated"',
      '"../rendering/compiler"',
      '"./articles"',
      '"./today"',
      '"../tooling/',
      '"server-only"',
      '"node:',
    ];

    for (const forbiddenSpecifier of forbiddenSpecifiers) {
      expect(interactionSource).not.toContain(forbiddenSpecifier);
    }
  });

  test("keeps the lazy search entrypoint client-safe", () => {
    expect(searchSource.startsWith('"use client";')).toBe(true);
    expect(searchSource).not.toContain('"../articles"');
    expect(searchSource).not.toContain('"./collection"');
    expect(searchSource).not.toContain('"./manifest.generated"');
    expect(searchSource).not.toContain('"server-only"');
    expect(searchSource).not.toContain('"node:');
  });
});
