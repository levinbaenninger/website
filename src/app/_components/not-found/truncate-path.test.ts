import { describe, expect, test } from "vite-plus/test";

import { truncatePath } from "@/app/_components/not-found/truncate-path";

const DISPLAY_LIMIT = 34;

describe("truncatePath", () => {
  test("keeps a short path verbatim", () => {
    expect(truncatePath("/blog/does-not-exist")).toBe("/blog/does-not-exist");
  });

  test("reports an empty pathname as the root path", () => {
    expect(truncatePath("")).toBe("/");
  });

  test("keeps the root path unchanged", () => {
    expect(truncatePath("/")).toBe("/");
  });

  test("keeps a path that ends exactly at the display limit", () => {
    const exact = `/${"a".repeat(DISPLAY_LIMIT - 1)}`;

    expect(exact).toHaveLength(DISPLAY_LIMIT);
    expect(truncatePath(exact)).toBe(exact);
  });

  test("keeps the trailing segment of an overlong path", () => {
    const truncated = truncatePath(`/blog/${"a".repeat(60)}/final-segment`);

    expect(truncated).toHaveLength(DISPLAY_LIMIT);
    expect(truncated.startsWith("…")).toBe(true);
    expect(truncated.endsWith("/final-segment")).toBe(true);
  });
});
