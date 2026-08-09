import { expect, test } from "@playwright/test";

import { navigateTo, readPageBackground } from "./helpers/navigation";

test("navigates between Portfolio and Blog with the selected theme", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Levin Bänninger"
  );

  const originalBackground = await readPageBackground(page);

  await page.getByRole("button", { name: "Toggle Mode" }).click();
  await expect
    .poll(async () => await readPageBackground(page))
    .not.toBe(originalBackground);
  const selectedBackground = await readPageBackground(page);

  await navigateTo(page, "Blog");
  await expect(page).toHaveURL("/blog");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Writing about nerdy stuff"
  );
  await expect
    .poll(async () => await readPageBackground(page))
    .toBe(selectedBackground);

  await page.reload();
  await expect
    .poll(async () => await readPageBackground(page))
    .toBe(selectedBackground);

  await navigateTo(page, "Portfolio");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Levin Bänninger"
  );
  await expect
    .poll(async () => await readPageBackground(page))
    .toBe(selectedBackground);
});
