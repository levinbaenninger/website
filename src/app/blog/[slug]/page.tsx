import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { requireCurrentArticle } from "@/app/_blog/article-route";
import { articleRouteContract } from "@/app/_blog/article-route-server";
import { createArticleMetadata } from "@/app/_blog/metadata";
import { ArticleStructuredData } from "@/app/_blog/structured-data";
import { ArticleView } from "@/modules/blog/articles";

interface ArticlePageProps {
  readonly params: Promise<{ readonly slug: string }>;
}

const resolveArticle = async ({ params }: ArticlePageProps) => {
  const { slug } = await params;
  const resolution = await articleRouteContract.resolve(slug);
  return requireCurrentArticle(resolution, {
    notFound,
    permanentRedirect,
  });
};

export const dynamicParams = false;

export const generateStaticParams = async () => {
  const params = await articleRouteContract.generateStaticParams();
  return params;
};

export const generateMetadata = async (
  props: ArticlePageProps
): Promise<Metadata> => createArticleMetadata(await resolveArticle(props));

export default async function ArticlePage(props: ArticlePageProps) {
  const article = await resolveArticle(props);

  return (
    <>
      <ArticleStructuredData article={article} />
      <ArticleView article={article} />
    </>
  );
}
