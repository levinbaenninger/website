import { expect, test } from "@playwright/test";

test("recovers from an unknown route", async ({ page }) => {
  await page.goto("/nothing-lives-here");

  await expect(
    page.getByRole("heading", { level: 1, name: "Page not found" })
  ).toBeVisible();
  await expect(
    page.getByText("/nothing-lives-here", { exact: true })
  ).toBeVisible();

  await page
    .getByRole("main")
    .getByRole("link", { name: "Blog", exact: true })
    .click();
  await expect(page).toHaveURL("/blog");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Writing about nerdy stuff"
  );
});
