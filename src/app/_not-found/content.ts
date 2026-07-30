import type { AppDestination } from "@/app/_shell/navigation/destinations";
import { APP_DESTINATIONS } from "@/app/_shell/navigation/destinations";

export type NotFoundVariant = "article" | "generic";

interface NotFoundCopy {
  title: string;
  description: string;
}

export const NOT_FOUND_COPY: Record<NotFoundVariant, NotFoundCopy> = {
  generic: {
    title: "Page not found",
    description: "The plotter went looking. There's nothing at this address.",
  },
  article: {
    title: "Article not found",
    description: "That Article isn't published, or it never existed.",
  },
};

const ARTICLE_PATH_PREFIX = "/blog/";

export const selectNotFoundVariant = (pathname: string): NotFoundVariant =>
  pathname.startsWith(ARTICLE_PATH_PREFIX) ? "article" : "generic";

const RECOVERY_HREF_ORDER: Record<NotFoundVariant, readonly string[]> = {
  generic: ["/", "/blog"],
  article: ["/blog", "/"],
};

/** Leads with the area the visitor was already in. */
export const orderRecoveryDestinations = (
  variant: NotFoundVariant
): AppDestination[] =>
  RECOVERY_HREF_ORDER[variant].flatMap((href) =>
    APP_DESTINATIONS.filter((destination) => destination.href === href)
  );
