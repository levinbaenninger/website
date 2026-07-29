import { describe, expect, test, vi } from "vite-plus/test";

import type { ArticleSocialImage } from "@/modules/blog/articles";

import { createArticleSocialImageContract } from "./social-image";

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
  const notFound = vi.fn((): never => {
    throw new Error("not found");
  });
  const render = vi.fn(() => new Response("png"));

  return {
    contract: createArticleSocialImageContract({
      findArticleSocialImage,
      listArticleSocialImages,
      notFound,
      render,
    }),
    findArticleSocialImage,
    listArticleSocialImages,
    notFound,
    render,
  };
};

describe("Article social-image adapter", () => {
  test("generates route params only for visible canonical Articles", async () => {
    const { contract } = createContract();

    await expect(contract.generateStaticParams()).resolves.toEqual([
      { slug: INPUT.slug },
    ]);
  });

  test("renders only visible canonical Article routes", async () => {
    const { contract, notFound, render } = createContract();

    await expect(
      contract.render({
        params: Promise.resolve({ slug: INPUT.slug }),
      })
    ).resolves.toBeInstanceOf(Response);
    expect(render).toHaveBeenCalledWith(INPUT);

    await expect(
      contract.render({
        params: Promise.resolve({ slug: "unknown" }),
      })
    ).rejects.toThrow("not found");
    await expect(
      contract.render({
        params: Promise.resolve({ slug: "Bad/Slug" }),
      })
    ).rejects.toThrow("not found");
    expect(notFound).toHaveBeenCalledTimes(2);
  });
});
