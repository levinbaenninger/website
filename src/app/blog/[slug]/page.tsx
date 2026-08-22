import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { toCanonicalUrl } from "@/app/_config/site-identity";
import { requireCurrentArticle } from "@/app/blog/[slug]/article-navigation";
import { createArticleMetadata } from "@/app/blog/_articles/metadata";
import {
  generateArticleStaticParams,
  resolveArticleDelivery,
} from "@/app/blog/_articles/server";
import { ArticleStructuredData } from "@/app/blog/_articles/structured-data";
import { ArticleView } from "@/features/blog/articles/reader/view";

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
        // Origin belongs to the app. A local Draft has no canonical destination, so headings keep the fragment without section-copy.
        canonicalUrl={
          article.status === "published" ? toCanonicalUrl(article.href) : null
        }
      />
    </>
  );
}
