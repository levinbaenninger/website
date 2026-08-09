import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const navigateTo = async (page: Page, destination: "Blog" | "Portfolio") => {
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

const readPageBackground = async (page: Page) =>
  await page
    .locator("body")
    .evaluate((body) => window.getComputedStyle(body).backgroundColor);

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

test("reads a directly opened Article and follows its neighbour", async ({
  page,
}) => {
  await page.goto("/blog/the-article-presentation-specimen");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Every construct the Article language allows",
    })
  ).toBeVisible();

  await page.getByRole("button", { name: "On this page" }).click();
  const outline = page.getByRole("navigation", { name: "On this page" });
  await expect(outline).toBeVisible();
  await outline
    .getByRole("link", { name: "Prose, links and inline semantics" })
    .click();
  await expect(page).toHaveURL(
    /\/blog\/the-article-presentation-specimen#prose-links-and-inline-semantics$/u
  );

  const accordion = page.getByRole("button", {
    name: "What does a closed panel do to the table of contents?",
  });
  await accordion.click();
  await expect(accordion).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByText(/Panels are force-mounted and hidden/u)
  ).toBeVisible();

  await page
    .getByRole("navigation", { name: "Neighbouring Articles" })
    .getByRole("link", {
      name: "Next Type-safe routes without a router rewrite",
    })
    .click();
  await expect(page).toHaveURL("/blog/type-safe-routes");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Type-safe routes without a router rewrite",
    })
  ).toBeVisible();
});

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
