import type { Page } from "@playwright/test";

export const navigateTo = async (
  page: Page,
  destination: "Blog" | "Portfolio"
) => {
  const desktopNavigation = page.getByRole("navigation", { name: "Primary" });

  if (await desktopNavigation.isVisible()) {
    await desktopNavigation.getByRole("link", { name: destination }).click();
    return;
  }

  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page
    .getByRole("navigation", { name: "Mobile primary" })
    .getByRole("link", { name: destination })
    .click();
};

export const readPageBackground = async (page: Page) =>
  await page
    .locator("body")
    .evaluate((body) => window.getComputedStyle(body).backgroundColor);
