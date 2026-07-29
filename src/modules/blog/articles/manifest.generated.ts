// Generated deterministically. Do not edit by hand.

import cover_understanding_cache_components from "../content/understanding-cache-components/assets/cover.png";
import type { ArticleManifestEntry } from "./collection";

export const ARTICLE_MANIFEST = [
  {
    slug: "understanding-cache-components",
    loadArticle: () =>
      import(
        "../content/understanding-cache-components/understanding-cache-components.mdx"
      ),
    cover: cover_understanding_cache_components,
  },
] as const satisfies readonly ArticleManifestEntry[];
