import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { createArticleMetadata } from "@/app/_blog/articles/metadata";
import {
  generateArticleStaticParams,
  resolveArticleDelivery,
} from "@/app/_blog/articles/server";
import { ArticleStructuredData } from "@/app/_blog/articles/structured-data";
import { toCanonicalUrl } from "@/app/_site/identity";
import { requireCurrentArticle } from "@/app/blog/[slug]/article-navigation";
import { ArticleView } from "@/features/blog/articles/view";

interface ArticlePageProps {
  readonly params: Promise<{ readonly slug: string }>;
}

const resolveArticle = async ({ params }: ArticlePageProps) => {
  const { slug } = await params;
  const resolution = await resolveArticleDelivery(slug);
  return requireCurrentArticle(resolution, {
    notFound,
    permanentRedirect,
  });
};

export const dynamicParams = false;

export const generateStaticParams = async () => {
  const params = await generateArticleStaticParams();
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
      <ArticleView
        article={article}
        // Origin belongs to the app, not to the Article. A local Draft has no
        // canonical destination, so it receives none and its headings keep the
        // fragment link without the public section-copy control.
        canonicalUrl={
          article.status === "published" ? toCanonicalUrl(article.href) : null
        }
      />
    </>
  );
}
