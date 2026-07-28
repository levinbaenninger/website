// Generated deterministically. Do not edit by hand.

import cover_understanding_cache_components from "./articles/understanding-cache-components/assets/cover.png";
import type { ArticleManifestEntry } from "./article-collection";

export const ARTICLE_MANIFEST = [
  {
    slug: "understanding-cache-components",
    loadArticle: () =>
      import(
        "./articles/understanding-cache-components/understanding-cache-components.mdx"
      ),
    cover: cover_understanding_cache_components,
  },
] as const satisfies readonly ArticleManifestEntry[];
