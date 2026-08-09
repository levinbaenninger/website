import { describe, expect, test, vi } from "vite-plus/test";

import { createArticleSocialImageDelivery } from "@/features/blog/articles/social-image";
import type { ArticleSocialImage } from "@/features/blog/articles/types";

const INPUT = {
  alt: "Visible Article — Levin Bänninger",
  label: "Article",
  slug: "visible-article",
  title: "Visible Article",
} as const satisfies ArticleSocialImage;

const createContract = () => {
  const listArticleSocialImages = vi.fn(async () => {
    await Promise.resolve();
    return [INPUT];
  });
  const findArticleSocialImage = vi.fn(async (slug: string) => {
    await Promise.resolve();
    return slug === INPUT.slug ? INPUT : null;
  });
  return {
    delivery: createArticleSocialImageDelivery({
      findArticleSocialImage,
      listArticleSocialImages,
    }),
    findArticleSocialImage,
    listArticleSocialImages,
  };
};

describe("Article social-image delivery", () => {
  test("generates route params only for visible canonical Articles", async () => {
    const { delivery } = createContract();

    await expect(delivery.generateStaticParams()).resolves.toEqual([
      { slug: INPUT.slug },
    ]);
  });

  test("resolves only valid, visible canonical Article slugs", async () => {
    const { delivery, findArticleSocialImage } = createContract();

    await expect(delivery.findInput(INPUT.slug)).resolves.toEqual(INPUT);
    await expect(delivery.findInput("unknown")).resolves.toBeNull();
    await expect(delivery.findInput("Bad/Slug")).resolves.toBeNull();
    expect(findArticleSocialImage).toHaveBeenCalledTimes(2);
  });
});
