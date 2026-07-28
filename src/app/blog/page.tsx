import { listArticles } from "@/app/_blog/server";
import { BlogView } from "@/modules/blog";

export default async function BlogPage() {
  return <BlogView articles={await listArticles()} />;
}
