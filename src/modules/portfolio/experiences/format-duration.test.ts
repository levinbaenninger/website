import { describe, expect, it } from "vite-plus/test";

import { formatDuration } from "./format-duration";

describe("formatDuration", () => {
  it("formats complete years", () => {
    expect(formatDuration("08.2023", "07.2027")).toBe("4y");
  });

  it("formats years and remaining months", () => {
    expect(formatDuration("08.2023", "10.2024")).toBe("1y 3m");
  });

  it("uses the current date for an ongoing position", () => {
    expect(formatDuration("08.2023", null, new Date("2026-07-15"))).toBe("3y");
  });
});
