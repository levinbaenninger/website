import { expect, test } from "@playwright/test";

// Unskip and replace the slugs, titles, outline heading, and Accordion copy when the first Published Articles land.
test.skip("reads a directly opened Article and follows its neighbour", async ({
  page,
}) => {
  const slug = "article-slug";
  const title = "Article title";
  const outlineHeading = "A heading in the outline";
  const outlineFragment = "a-heading-in-the-outline";
  const accordionName = "Accordion trigger";
  const accordionBody = /Revealed panel text/u;
  const nextTitle = "Neighbouring Article title";
  const nextSlug = "neighbouring-slug";

  await page.goto(`/blog/${slug}`);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: title,
    })
  ).toBeVisible();

  await page.getByRole("button", { name: "On this page" }).click();
  const outline = page.getByRole("navigation", { name: "On this page" });
  await expect(outline).toBeVisible();
  await outline.getByRole("link", { name: outlineHeading }).click();
  await expect(page).toHaveURL(
    new RegExp(`/blog/${slug}#${outlineFragment}$`, "u")
  );

  const accordion = page.getByRole("button", {
    name: accordionName,
  });
  await accordion.click();
  await expect(accordion).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText(accordionBody)).toBeVisible();

  await page
    .getByRole("navigation", { name: "Neighbouring Articles" })
    .getByRole("link", {
      name: `Next ${nextTitle}`,
    })
    .click();
  await expect(page).toHaveURL(`/blog/${nextSlug}`);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: nextTitle,
    })
  ).toBeVisible();
});
