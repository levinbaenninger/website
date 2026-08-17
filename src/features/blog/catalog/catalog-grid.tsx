import type { ArticleSummary } from "@/features/blog/articles/types";
import type { ArticleSearchResult } from "@/features/blog/search/service";
import { cn } from "@/shared/ui/cn";

import { ArticleCard } from "./article-card";

// First row of Covers is eager: two columns fit above the fold at the 48 rem rail.
const EAGER_CARD_COUNT = 4;

// Below `sm` every card draws its own lines; from `sm` the odd card of each
// pair draws them so the row shares one rule.
const GRID_ITEM_CLASS = cn(
  "max-sm:screen-line-top max-sm:screen-line-bottom",
  "sm:nth-[2n+1]:screen-line-top sm:nth-[2n+1]:screen-line-bottom"
);

// A lookup rather than a second list: the grid geometry stays the same, and a
// missing entry means this card has nothing to highlight.
export const CatalogGrid = ({
  articles,
  explanations,
}: {
  articles: readonly ArticleSummary[];
  explanations?: ReadonlyMap<string, ArticleSearchResult>;
}) => (
  <div className="relative pt-4">
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-1 grid grid-cols-1 gap-4 max-sm:hidden sm:grid-cols-2"
    >
      <div className="border-r border-line" />
      <div className="border-l border-line" />
    </div>
    {/* Cards in a row share a height so their pinned meta rows line up. */}
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {articles.map((article, index) => {
        const explanation = explanations?.get(article.slug);

        return (
          <li className={GRID_ITEM_CLASS} key={article.slug}>
            <ArticleCard
              article={article}
              eager={index < EAGER_CARD_COUNT}
              snippet={explanation?.snippet ?? null}
              title={explanation?.title ?? null}
            />
          </li>
        );
      })}
    </ul>
  </div>
);
