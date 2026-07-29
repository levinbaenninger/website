import { describe, expect, test } from "vite-plus/test";

import { PORTFOLIO_SOCIAL_IMAGE } from "@/modules/portfolio/social-image";

describe("Portfolio social-image input", () => {
  test("exposes the exact renderer-neutral Portfolio identity", () => {
    expect(PORTFOLIO_SOCIAL_IMAGE).toEqual({
      alt: "Levin Bänninger — Portfolio",
      label: "Portfolio",
      title: "Levin Bänninger",
    });
  });
});
