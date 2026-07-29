import type { ArticleDetail, ArticleSummary, ArticleTagFacet } from "./types";

interface BlogViewProps {
  readonly articles: readonly ArticleSummary[];
  readonly tags: readonly ArticleTagFacet[];
}

export const BlogView = ({ articles, tags }: BlogViewProps) => (
  <main>
    <h1>Blog</h1>
    {tags.length > 0 ? (
      <ul aria-label="Tags">
        {tags.map((tag) => (
          <li key={tag.id}>
            {tag.label} ({tag.articleCount})
          </li>
        ))}
      </ul>
    ) : null}
    {articles.length === 0 ? (
      <p>No published Articles yet.</p>
    ) : (
      <ul>
        {articles.map((article) => (
          <li key={article.slug}>
            {article.title}
            {article.status === "draft" ? " — Draft" : null}
          </li>
        ))}
      </ul>
    )}
  </main>
);

interface ArticleViewProps {
  readonly article: ArticleDetail;
}

export const ArticleView = ({ article }: ArticleViewProps) => {
  const { Content } = article;

  return (
    <main>
      <article>
        {article.status === "draft" ? <p>Draft</p> : null}
        <h1>{article.title}</h1>
        <Content />
      </article>
    </main>
  );
};
