import { createPublishedArticleStructuredDataInput } from "@/app/_blog/articles/metadata";
import type { ArticleDetail } from "@/features/blog/articles/types";

export const serializeJsonLd = (value: unknown): string =>
  JSON.stringify(value).replaceAll("<", "\\u003c");

export const ArticleStructuredData = ({
  article,
}: {
  readonly article: ArticleDetail;
}) => {
  if (article.status === "draft") {
    return null;
  }

  const {
    id,
    url,
    mainEntityOfPage,
    headline,
    description,
    image,
    datePublished,
    dateModified,
    author,
    keywords,
    inLanguage,
  } = createPublishedArticleStructuredDataInput(article);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": id,
    url,
    mainEntityOfPage,
    headline,
    description,
    image,
    datePublished,
    ...(dateModified === undefined ? {} : { dateModified }),
    author: {
      "@type": "Person",
      "@id": author.id,
      name: author.name,
      url: author.url,
    },
    keywords,
    inLanguage,
  };

  return <script type="application/ld+json">{serializeJsonLd(jsonLd)}</script>;
};
