import type { ArticleDetail } from "@/features/blog/articles/types";
import { ArticleBody } from "@/features/blog/rendering/body";

import { ArticleNeighbourHotkeys } from "./neighbour-hotkeys";
import { ArticleOutlineCard, ArticleOutlineMinimap } from "./outline";
import {
  ArticleHeader,
  EndPager,
  ProseColumn,
  ReaderBottomLine,
  ReaderGrid,
  ReaderRail,
  ReaderToolbar,
  ReaderTopLine,
} from "./reader-chrome";

interface ArticleViewProps {
  readonly article: ArticleDetail;
  // Origin is app-owned. `null` withholds Share and section-copy: the local Draft case.
  readonly canonicalUrl?: string | null;
}

export const ArticleView = ({
  article,
  canonicalUrl = null,
}: ArticleViewProps) => {
  const { Content, navigation } = article;

  // One heading is not an outline: it names the Article a second time and gives
  // a visitor nothing to choose between. Below two, both surfaces are omitted
  // and the space they would have taken goes back to the Article.
  const outline = article.outline.length < 2 ? null : article.outline;

  return (
    <article className="flex flex-1 flex-col" data-slot="article-reader">
      <ReaderRail>
        <ReaderTopLine />
      </ReaderRail>

      <ReaderToolbar
        canonicalUrl={canonicalUrl}
        navigation={navigation}
        title={article.title}
      />

      <ArticleNeighbourHotkeys />

      <ReaderRail>
        <ArticleHeader article={article} />
      </ReaderRail>

      <ReaderGrid
        outline={
          outline === null ? null : <ArticleOutlineMinimap outline={outline} />
        }
      >
        <ReaderRail>
          <ProseColumn>
            {outline === null ? null : (
              <ArticleOutlineCard
                className="mb-8 lg:hidden"
                outline={outline}
              />
            )}

            <ArticleBody canonicalUrl={canonicalUrl}>
              <Content />
            </ArticleBody>
          </ProseColumn>

          <EndPager navigation={navigation} />
          <ReaderBottomLine />
        </ReaderRail>
      </ReaderGrid>
    </article>
  );
};
