import { expect, test } from "@playwright/test";

test("shows the empty Blog catalog without discovery controls", async ({
  page,
}) => {
  await page.goto("/blog");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Writing about nerdy stuff"
  );
  await expect(page.getByText("Fresh page, no ink yet")).toBeVisible();
  await expect(page.getByText("New writing will turn up here.")).toBeVisible();
  await expect(
    page.getByRole("searchbox", { name: "Search Articles" })
  ).toHaveCount(0);
});

// Unskip and replace the query, Tag, title, and slug when the first Published Article lands. Drop the empty-catalog journey above at the same time.
test.skip("discovers an Article with search and a Tag filter", async ({
  page,
}) => {
  const query = "search term";
  const title = "Article title";
  const tagLabel = /^Tag label 1 Article$/u;
  const tag = "tag-id";
  const slug = "article-slug";

  await page.goto("/blog");

  await page.getByRole("searchbox", { name: "Search Articles" }).fill(query);
  await expect(page.getByRole("link", { name: title })).toBeVisible();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("q"))
    .toBe(query);

  const tagFilter = page.getByRole("radio", { name: tagLabel });
  await tagFilter.focus();
  await tagFilter.press("Space");
  await expect(tagFilter).toBeChecked();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("tag"))
    .toBe(tag);

  await page.getByRole("link", { name: title }).click();
  await expect(page).toHaveURL(`/blog/${slug}`);
  await expect(
    page.getByRole("heading", { level: 1, name: title })
  ).toBeVisible();
});
