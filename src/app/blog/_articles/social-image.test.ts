import { describe, expect, test, vi } from "vite-plus/test";

import { createArticleSocialImageAdapter } from "@/app/blog/_articles/social-image";
import type { ArticleSocialImage } from "@/features/blog/articles/types";

const INPUT = {
  alt: "Visible Article — Levin Bänninger",
  label: "Article",
  slug: "visible-article",
  title: "Visible Article",
} as const satisfies ArticleSocialImage;

const createAdapter = () => {
  const generateStaticParams = vi.fn(async () => {
    await Promise.resolve();
    return [{ slug: INPUT.slug }];
  });
  const findInput = vi.fn(async (slug: string) => {
    await Promise.resolve();
    return slug === INPUT.slug ? INPUT : null;
  });
  const notFound = vi.fn((): never => {
    throw new Error("not found");
  });
  const render = vi.fn(() => new Response("png"));

  return {
    adapter: createArticleSocialImageAdapter({
      findInput,
      generateStaticParams,
      notFound,
      render,
    }),
    findInput,
    generateStaticParams,
    notFound,
    render,
  };
};

describe("Article social-image adapter", () => {
  test("forwards Blog static parameters", async () => {
    const { adapter, generateStaticParams } = createAdapter();

    await expect(adapter.generateStaticParams()).resolves.toStrictEqual([
      { slug: INPUT.slug },
    ]);
    expect(generateStaticParams).toHaveBeenCalledOnce();
  });

  test("renders resolved inputs and maps absence to not-found", async () => {
    const { adapter, notFound, render } = createAdapter();

    await expect(
      adapter.render({ params: Promise.resolve({ slug: INPUT.slug }) })
    ).resolves.toBeInstanceOf(Response);
    expect(render).toHaveBeenCalledWith(INPUT);

    await expect(
      adapter.render({ params: Promise.resolve({ slug: "unknown" }) })
    ).rejects.toThrow("not found");
    expect(notFound).toHaveBeenCalledOnce();
  });
});
