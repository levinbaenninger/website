import type { Metadata } from "next";

import { listArticles, listArticleTags } from "@/app/blog/_articles/server";
import { createBlogMetadata } from "@/app/blog/_catalog/metadata";
import { BlogView } from "@/features/blog/catalog/view";

export const metadata: Metadata = createBlogMetadata();

// Catalog reads no request-time API: `?q=` and `?tag=` belong to the discovery island, which keeps `/blog` static.
export default async function BlogPage() {
  const [articles, tags] = await Promise.all([
    listArticles(),
    listArticleTags(),
  ]);

  return <BlogView articles={articles} tags={tags} />;
}
