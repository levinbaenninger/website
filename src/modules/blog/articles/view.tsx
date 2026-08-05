import { ArticleBody } from "@/modules/blog/rendering/body";

import type { ArticleDetail } from "./types";

interface ArticleViewProps {
  readonly article: ArticleDetail;
  /**
   * The absolute canonical Article URL, supplied by the app because origin is
   * app-owned. `null` withholds the public section-copy controls, which is the
   * local Draft case.
   */
  readonly canonicalUrl?: string | null;
}

export const ArticleView = ({
  article,
  canonicalUrl = null,
}: ArticleViewProps) => {
  const { Content } = article;

  return (
    <article>
      {article.status === "draft" ? <p>Draft</p> : null}
      <h1>{article.title}</h1>
      <ArticleBody canonicalUrl={canonicalUrl}>
        <Content />
      </ArticleBody>
    </article>
  );
};
