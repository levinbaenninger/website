import type { ArticleSocialImage } from "@/modules/blog/articles";
import type { SocialImageInput } from "@/shared/social-image";

import { isArticleSlug } from "./article-route";

interface ArticleSocialImageOperations {
  readonly findArticleSocialImage: (
    slug: string
  ) => Promise<ArticleSocialImage | null>;
  readonly listArticleSocialImages: () => Promise<
    readonly ArticleSocialImage[]
  >;
}

interface ArticleSocialImageNavigation {
  readonly notFound: () => never;
}

interface ArticleSocialImageRenderer {
  readonly render: (input: SocialImageInput) => Response;
}

interface ArticleSocialImageRenderProps {
  readonly params: Promise<{ readonly slug: string }>;
}

export const createArticleSocialImageContract = ({
  findArticleSocialImage,
  listArticleSocialImages,
  notFound,
  render,
}: ArticleSocialImageOperations &
  ArticleSocialImageNavigation &
  ArticleSocialImageRenderer) => {
  const findInput = async (slug: string) =>
    isArticleSlug(slug) ? await findArticleSocialImage(slug) : null;

  return {
    async generateStaticParams() {
      const inputs = await listArticleSocialImages();
      return inputs.map(({ slug }) => ({ slug }));
    },
    async render({ params }: ArticleSocialImageRenderProps) {
      const { slug } = await params;
      const input = await findInput(slug);
      if (input === null) {
        return notFound();
      }

      return render(input);
    },
  };
};
