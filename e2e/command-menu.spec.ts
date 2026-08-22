import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("keeps the mobile page gutter while the command menu is open", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Calculating…")).toBeHidden();

  const pageSection = page.locator("body > main > section").first();
  const closedBounds = await pageSection.boundingBox();

  expect(closedBounds).not.toBeNull();

  await page.getByRole("button", { name: "Search…" }).click();
  await expect(
    page.getByRole("dialog", { name: "Command Palette" })
  ).toBeVisible();

  const openBounds = await pageSection.boundingBox();

  expect(openBounds).not.toBeNull();
  expect(openBounds?.x).toBe(closedBounds?.x);
  expect(openBounds?.width).toBe(closedBounds?.width);
});
