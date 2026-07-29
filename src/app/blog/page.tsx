import type { Metadata } from "next";

import { listArticles, listArticleTags } from "@/app/_blog/articles/server";
import { createBlogMetadata } from "@/app/_blog/catalog/metadata";
import { BlogView } from "@/modules/blog";

export const metadata: Metadata = createBlogMetadata();

export default async function BlogPage() {
  const [articles, tags] = await Promise.all([
    listArticles(),
    listArticleTags(),
  ]);
  return <BlogView articles={articles} tags={tags} />;
}
