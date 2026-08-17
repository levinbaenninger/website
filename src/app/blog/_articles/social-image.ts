import type { ArticleSocialImage } from "@/features/blog/articles/types";
import type { SocialImageInput } from "@/shared/social-image";

interface ArticleSocialImageAdapterDependencies {
  readonly findInput: (slug: string) => Promise<ArticleSocialImage | null>;
  readonly generateStaticParams: () => Promise<{ readonly slug: string }[]>;
  readonly notFound: () => never;
  readonly render: (input: SocialImageInput) => Response;
}

interface ArticleSocialImageRenderProps {
  readonly params: Promise<{ readonly slug: string }>;
}

export const createArticleSocialImageAdapter = ({
  findInput,
  generateStaticParams,
  notFound,
  render,
}: ArticleSocialImageAdapterDependencies) => ({
  generateStaticParams,
  async render({ params }: ArticleSocialImageRenderProps) {
    const { slug } = await params;
    const input = await findInput(slug);
    if (input === null) {
      return notFound();
    }

    return render(input);
  },
});
