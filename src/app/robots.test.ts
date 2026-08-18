import { expect, test } from "vite-plus/test";

import robots from "./robots";

test("serves the exact production robots policy", () => {
  expect(robots()).toStrictEqual({
    rules: { allow: "/", userAgent: "*" },
    sitemap: "https://levin.baenninger.me/sitemap.xml",
  });
});
