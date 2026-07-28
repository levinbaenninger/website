import type { FixedArticleDestination } from "@/modules/blog/server";

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
