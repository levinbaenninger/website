import { readFileSync } from "node:fs";

import { describe, expect, test } from "vite-plus/test";

const interactionSource = readFileSync(
  new URL("article-interactions.tsx", import.meta.url),
  "utf-8"
);
const registrySource = readFileSync(
  new URL("index.ts", import.meta.url),
  "utf-8"
);

describe("Article server and client boundaries", () => {
  test("keeps the Article registry server-first", () => {
    expect(registrySource.startsWith('"use client"')).toBe(false);
    expect(interactionSource.startsWith('"use client";')).toBe(true);
  });

  test("keeps server capabilities out of the interaction entrypoint", () => {
    const forbiddenSpecifiers = [
      '"./article-collection"',
      '"./article-manifest.generated"',
      '"./compiler"',
      '"./server"',
      '"./today"',
      '"./tooling/',
      '"server-only"',
      '"node:',
    ];

    for (const forbiddenSpecifier of forbiddenSpecifiers) {
      expect(interactionSource).not.toContain(forbiddenSpecifier);
    }
  });
});
