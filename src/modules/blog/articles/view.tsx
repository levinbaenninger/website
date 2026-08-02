import type { ArticleDetail } from "./types";

interface ArticleViewProps {
  readonly article: ArticleDetail;
}

export const ArticleView = ({ article }: ArticleViewProps) => {
  const { Content } = article;

  return (
    <article>
      {article.status === "draft" ? <p>Draft</p> : null}
      <h1>{article.title}</h1>
      <Content />
    </article>
  );
};
