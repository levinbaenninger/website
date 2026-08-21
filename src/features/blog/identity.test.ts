import { expect, test } from "vite-plus/test";

import { createBlogIdentity } from "./identity";

test("defines Blog identity relative to the publishing site", () => {
  expect(createBlogIdentity("Example Author")).toStrictEqual({
    description:
      "Writing about nerdy stuff, mostly software, the web, and whatever else catches my attention.",
    name: "Example Author’s Blog",
    title: "Blog | Example Author",
  });
});
