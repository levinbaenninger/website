// Generated deterministically. Do not edit by hand.

import cover_budgeting_images from "../content/budgeting-images/assets/cover.png";
import cover_seams_worth_testing from "../content/seams-worth-testing/assets/cover.png";
import cover_streaming_with_suspense from "../content/streaming-with-suspense/assets/cover.png";
import cover_the_article_presentation_specimen from "../content/the-article-presentation-specimen/assets/cover.png";
import cover_type_safe_routes from "../content/type-safe-routes/assets/cover.png";
import cover_understanding_cache_components from "../content/understanding-cache-components/assets/cover.png";
import type { ArticleManifestEntry } from "./collection";

export const ARTICLE_MANIFEST = [
  {
    slug: "budgeting-images",
    loadArticle: () =>
      import(
        "../content/budgeting-images/budgeting-images.mdx"
      ),
    cover: cover_budgeting_images,
  },
  {
    slug: "seams-worth-testing",
    loadArticle: () =>
      import(
        "../content/seams-worth-testing/seams-worth-testing.mdx"
      ),
    cover: cover_seams_worth_testing,
  },
  {
    slug: "streaming-with-suspense",
    loadArticle: () =>
      import(
        "../content/streaming-with-suspense/streaming-with-suspense.mdx"
      ),
    cover: cover_streaming_with_suspense,
  },
  {
    slug: "the-article-presentation-specimen",
    loadArticle: () =>
      import(
        "../content/the-article-presentation-specimen/the-article-presentation-specimen.mdx"
      ),
    cover: cover_the_article_presentation_specimen,
  },
  {
    slug: "type-safe-routes",
    loadArticle: () =>
      import(
        "../content/type-safe-routes/type-safe-routes.mdx"
      ),
    cover: cover_type_safe_routes,
  },
  {
    slug: "understanding-cache-components",
    loadArticle: () =>
      import(
        "../content/understanding-cache-components/understanding-cache-components.mdx"
      ),
    cover: cover_understanding_cache_components,
  },
] as const satisfies readonly ArticleManifestEntry[];
