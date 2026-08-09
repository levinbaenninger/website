import type { ArticleDeliveryResolution } from "@/features/blog/articles/delivery";
import type { ArticleDetail } from "@/features/blog/articles/types";

interface ArticleNavigation {
  readonly notFound: () => never;
  readonly permanentRedirect: (
    destination: `/blog/${string}`,
    type: "replace"
  ) => never;
}

export const requireCurrentArticle = (
  resolution: ArticleDeliveryResolution,
  navigation: ArticleNavigation
): ArticleDetail => {
  if (resolution.kind === "redirect") {
    navigation.permanentRedirect(resolution.destination, "replace");
  }

  if (resolution.kind === "not-found") {
    navigation.notFound();
  }

  return resolution.article;
};
