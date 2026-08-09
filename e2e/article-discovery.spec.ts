import { expect, test } from "@playwright/test";

test("discovers an Article with search and a Tag filter", async ({ page }) => {
  await page.goto("/blog");

  await page.getByRole("searchbox", { name: "Search Articles" }).fill("seam");
  await expect(
    page.getByRole("link", { name: "Seams worth testing" })
  ).toBeVisible();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("q"))
    .toBe("seam");

  const testingTag = page.getByRole("radio", { name: /^Testing 1 Article$/u });
  await testingTag.focus();
  await testingTag.press("Space");
  await expect(testingTag).toBeChecked();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("tag"))
    .toBe("testing");

  await page.getByRole("link", { name: "Seams worth testing" }).click();
  await expect(page).toHaveURL("/blog/seams-worth-testing");
  await expect(
    page.getByRole("heading", { level: 1, name: "Seams worth testing" })
  ).toBeVisible();
});
