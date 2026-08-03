import type { ArticleSummary } from "@/modules/blog/articles/types";
import { cn } from "@/shared/ui/cn";

import { ArticleCard } from "./article-card";

// Two columns fit above the fold at the 48 rem rail, so the first row of
// Covers loads eagerly and the rest wait until they are scrolled towards.
const EAGER_CARD_COUNT = 4;

// Guide lines: below `sm` every card is bounded top and bottom; from `sm` the
// odd card of each pair draws the pair's lines, so the row shares one rule.
const GRID_ITEM_CLASS = cn(
  "max-sm:screen-line-top max-sm:screen-line-bottom",
  "sm:nth-[2n+1]:screen-line-top sm:nth-[2n+1]:screen-line-bottom"
);

export const CatalogGrid = ({
  articles,
}: {
  articles: readonly ArticleSummary[];
}) => (
  <div className="relative pt-4">
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-1 grid grid-cols-1 gap-4 max-sm:hidden sm:grid-cols-2"
    >
      <div className="border-r border-line" />
      <div className="border-l border-line" />
    </div>
    {/* `items-stretch` is the grid default; cards in a row therefore share a
        height and their pinned meta rows line up. */}
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {articles.map((article, index) => (
        <li className={GRID_ITEM_CLASS} key={article.slug}>
          <ArticleCard article={article} eager={index < EAGER_CARD_COUNT} />
        </li>
      ))}
    </ul>
  </div>
);
