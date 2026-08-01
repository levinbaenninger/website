import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { createArticleMetadata } from "@/app/_blog/articles/metadata";
import { requireCurrentArticle } from "@/app/_blog/articles/route";
import { articleRouteContract } from "@/app/_blog/articles/route-server";
import { ArticleStructuredData } from "@/app/_blog/articles/structured-data";
// PROTOTYPE — issue #33. Remove this import together with the prototype
// directory once a reader composition is chosen.
import { ArticleReaderPrototype, readPrototypeSelection } from "@/modules/blog";
import { ArticleView } from "@/modules/blog/articles";

interface ArticlePageProps {
  readonly params: Promise<{ readonly slug: string }>;
  readonly searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
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

  // PROTOTYPE — issue #33. `searchParams` is only awaited outside production so
  // the real route stays statically prerendered.
  if (process.env.NODE_ENV !== "production") {
    const selection = readPrototypeSelection((await props.searchParams) ?? {});

    if (selection !== null) {
      return (
        <ArticleReaderPrototype
          article={{
            description: article.description,
            slug: article.slug,
            tags: article.tags,
            title: article.title,
          }}
          selection={selection}
        />
      );
    }
  }

  return (
    <>
      <ArticleStructuredData article={article} />
      <ArticleView article={article} />
    </>
  );
}
