import type { ArticleSearchDocument } from "@/features/blog/articles/types";
import { serializeArticleSearchArtifact } from "@/features/blog/search/contract";

export const createArticleSearchResponse = (
  documents: readonly ArticleSearchDocument[]
): Response =>
  new Response(serializeArticleSearchArtifact(documents), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow, nosnippet",
    },
  });
