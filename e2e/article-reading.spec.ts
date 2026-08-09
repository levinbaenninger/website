import { expect, test } from "@playwright/test";

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
