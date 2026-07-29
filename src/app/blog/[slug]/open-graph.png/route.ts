import {
  generateArticleSocialImageStaticParams,
  renderArticleSocialImage,
} from "@/app/_blog/articles/social-image-server";

interface ArticleSocialImageRouteContext {
  readonly params: Promise<{ readonly slug: string }>;
}

export const dynamicParams = false;
export const dynamic = "force-static";

export const generateStaticParams = async () =>
  await generateArticleSocialImageStaticParams();

export const GET = async (
  _request: Request,
  context: ArticleSocialImageRouteContext
) => await renderArticleSocialImage(context);
