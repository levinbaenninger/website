import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { createArticleMetadata } from "@/app/_blog/articles/metadata";
import { requireCurrentArticle } from "@/app/_blog/articles/route";
import { articleRouteContract } from "@/app/_blog/articles/route-server";
import { ArticleStructuredData } from "@/app/_blog/articles/structured-data";
import { toCanonicalUrl } from "@/app/_site/identity";
// PROTOTYPE — issues #33 and #34. Remove these imports together with the
// prototype directories once a reader composition and a presentation language
// are chosen.
import {
  ArticleLanguagePrototype,
  ArticleReaderPrototype,
  readLanguageSelection,
  readPrototypeSelection,
} from "@/modules/blog";
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

  // PROTOTYPE — issues #33 and #34. `searchParams` is only awaited outside
  // production so the real route stays statically prerendered. `?language=`
  // mounts the presentation-language specimen; `?variant=` mounts the reader.
  if (process.env.NODE_ENV !== "production") {
    const searchParams = (await props.searchParams) ?? {};
    const language = readLanguageSelection(searchParams);

    if (language !== null) {
      return <ArticleLanguagePrototype selection={language} />;
    }

    const selection = readPrototypeSelection(searchParams);

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
