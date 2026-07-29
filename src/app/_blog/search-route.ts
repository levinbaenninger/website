import { serializeArticleSearchArtifact } from "@/modules/blog/search-artifact";
import type { ArticleSearchDocument } from "@/modules/blog/search-artifact";

export const createArticleSearchResponse = (
  documents: readonly ArticleSearchDocument[]
): Response =>
  new Response(serializeArticleSearchArtifact(documents), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow, nosnippet",
    },
  });
