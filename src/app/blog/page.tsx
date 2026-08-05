import type { Metadata } from "next";

import { listArticles, listArticleTags } from "@/app/_blog/articles/server";
import { createBlogMetadata } from "@/app/_blog/catalog/metadata";
import {
  // PROTOTYPE — issue #32. Remove these four imports together with the
  // prototype directory once a catalog composition is chosen.
  BlogCatalogPrototype,
  BlogView,
  isAlignment,
  isCardLayout,
  isPrototypeState,
  isSnippetMode,
  isVariantKey,
} from "@/modules/blog";

export const metadata: Metadata = createBlogMetadata();

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // `searchParams` is a request-time API: reading it unconditionally would opt
  // the catalog out of prerendering. Only the development-only prototype needs
  // it, so the await stays inside the gate that the production build removes.
  if (process.env.NODE_ENV !== "production") {
    const params = await searchParams;

    if (isVariantKey(params.variant)) {
      return (
        <BlogCatalogPrototype
          alignment={isAlignment(params.align) ? params.align : "meta-bottom"}
          cardLayout={isCardLayout(params.card) ? params.card : "stacked"}
          snippetMode={
            isSnippetMode(params.snippet) ? params.snippet : "conditional"
          }
          state={isPrototypeState(params.state) ? params.state : "default"}
          variant={params.variant}
        />
      );
    }
  }

  const [articles, tags] = await Promise.all([
    listArticles(),
    listArticleTags(),
  ]);

  return <BlogView articles={articles} tags={tags} />;
}
