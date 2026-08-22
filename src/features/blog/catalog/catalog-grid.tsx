import type { ArticleSummary } from "@/features/blog/articles/types";
import type { ArticleSearchResult } from "@/features/blog/search/service";
import { cn } from "@/shared/ui/cn";

import { ArticleCard } from "./article-card";

const EAGER_CARD_COUNT = 4;

const GRID_ITEM_CLASS = cn(
  "max-sm:screen-line-top max-sm:screen-line-bottom",
  "sm:nth-[2n+1]:screen-line-top sm:nth-[2n+1]:screen-line-bottom"
);

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
