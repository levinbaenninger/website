import type {
  ArticleSummary,
  ArticleTagFacet,
} from "@/modules/blog/articles/types";

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
