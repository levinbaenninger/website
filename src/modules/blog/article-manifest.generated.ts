// Generated deterministically. Do not add Article metadata to this file.

import coverUnderstandingCacheComponents from "./articles/understanding-cache-components/assets/cover.png";
import type { ArticleManifestEntry } from "./article-collection";

export const ARTICLE_MANIFEST = [
  {
    slug: "understanding-cache-components",
    loadArticle: () =>
      import(
        "./articles/understanding-cache-components/understanding-cache-components.mdx"
      ),
    cover: coverUnderstandingCacheComponents,
  },
] as const satisfies readonly ArticleManifestEntry[];
