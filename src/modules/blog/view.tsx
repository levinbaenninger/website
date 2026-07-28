import { listArticles } from "./server";

export const BlogView = async () => {
  const articles = await listArticles();

  return (
    <main>
      <h1>Blog</h1>
      {articles.length === 0 ? (
        <p>No published Articles yet.</p>
      ) : (
        <ul>
          {articles.map((article) => (
            <li key={article.slug}>
              {article.title}
              {article.status === "Draft" ? " — Draft" : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};
