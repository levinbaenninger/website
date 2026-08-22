import { isArticleSlug } from "./delivery";
import type { ArticleSocialImage } from "./types";

interface ArticleSocialImageSource {
  readonly findArticleSocialImage: (
    slug: string
  ) => Promise<ArticleSocialImage | null>;
  readonly listArticleSocialImages: () => Promise<
    readonly ArticleSocialImage[]
  >;
}

export const createArticleSocialImageDelivery = (
  source: ArticleSocialImageSource
) => ({
  async generateStaticParams(): Promise<{ readonly slug: string }[]> {
    const inputs = await source.listArticleSocialImages();
    return inputs.map(({ slug }) => ({ slug }));
  },
  async findInput(slug: string): Promise<ArticleSocialImage | null> {
    return isArticleSlug(slug)
      ? await source.findArticleSocialImage(slug)
      : null;
  },
});
