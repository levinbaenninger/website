import type { FixedArticleDestination } from "@/features/blog/articles/collection";

export const ARTICLE_FIXED_DESTINATIONS = [
  {
    pathname: "/",
    fragments: [
      "about",
      "stack",
      "experience",
      "education",
      "projects",
      "achievements",
      "bookmarks",
    ],
  },
  {
    pathname: "/blog",
    fragments: [],
  },
] as const satisfies readonly FixedArticleDestination[];
