import { ARTICLE_DELIVERY_IDENTITY } from "@/app/_blog/articles/metadata";
import { createArticleStructuredData } from "@/features/blog/articles/delivery-metadata";
import type { ArticleDetail } from "@/features/blog/articles/types";

export const serializeJsonLd = (value: unknown): string =>
  JSON.stringify(value).replaceAll("<", "\\u003c");

export const ArticleStructuredData = ({
  article,
}: {
  readonly article: ArticleDetail;
}) => {
  const jsonLd = createArticleStructuredData(
    article,
    ARTICLE_DELIVERY_IDENTITY
  );
  if (jsonLd === null) {
    return null;
  }

  return <script type="application/ld+json">{serializeJsonLd(jsonLd)}</script>;
};
