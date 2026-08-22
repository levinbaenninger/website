import "server-only";
import { createArticleOperations } from "./collection";
import type { FixedArticleDestination } from "./collection";
import { createArticleDeliveryOperations } from "./delivery";
import { ARTICLE_MANIFEST } from "./manifest.generated";
import { createArticleSocialImageDelivery } from "./social-image";
import { getZurichToday } from "./today";

export const createArticleServer = (
  fixedDestinations: readonly FixedArticleDestination[]
) => {
  const operations = createArticleOperations({
    fixedDestinations,
    manifest: ARTICLE_MANIFEST,
    includeDrafts: process.env.NODE_ENV === "development",
    today: getZurichToday(),
  });
  const delivery = createArticleDeliveryOperations(operations);
  const socialImageDelivery = createArticleSocialImageDelivery(operations);

  return {
    ...operations,
    findArticleSocialImageInput: async (slug: string) =>
      await socialImageDelivery.findInput(slug),
    listArticleSocialImageRouteParams: async () =>
      await socialImageDelivery.generateStaticParams(),
    generateArticleStaticParams: async () =>
      await delivery.generateStaticParams(),
    resolveArticleDelivery: async (slug: string) =>
      await delivery.resolve(slug),
  };
};
