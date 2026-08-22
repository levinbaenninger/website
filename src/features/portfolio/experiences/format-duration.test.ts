import { describe, expect, test } from "vite-plus/test";

import { formatDuration } from "./format-duration";

describe("experience duration", () => {
  test("counts the starting month", () => {
    expect(formatDuration("01.2026", "01.2026")).toBe("1m");
  });

  test("formats exact and partial years", () => {
    expect(formatDuration("01.2025", "12.2025")).toBe("1y");
    expect(formatDuration("01.2025", "02.2026")).toBe("1y 2m");
  });

  test("uses the current month for an ongoing experience", () => {
    expect(formatDuration("08.2023", null, new Date(2026, 6, 15))).toBe("3y");
  });
});
