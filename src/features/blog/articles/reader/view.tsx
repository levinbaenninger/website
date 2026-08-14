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
  /**
   * The absolute canonical Article URL, supplied by the app because origin is
   * app-owned. `null` withholds the Share menu and the public section-copy
   * controls alike, which is the local Draft case.
   */
  readonly canonicalUrl?: string | null;
}

/**
 * The Article reader.
 *
 * Everything a visitor needs in order to read the Article and leave it is
 * server-rendered: the header, the compiled body, the Blog link, both
 * neighbour links, the end pager, and the outline's own heading links.
 * Hydration adds what the server cannot know — a scroll position, which heading
 * it puts the visitor in, and a keyboard.
 *
 * Neighbour links are ordinary route links, which is also what starts the
 * destination Article at the top: from anywhere past the fold the destination's
 * first element is outside the viewport, so Next.js scrolls to it, while
 * browser Back and Forward keep their own restored positions. Nothing here
 * stores navigation history of its own. The `h` and `l` keys are a shortcut to
 * those same two destinations and land on them the same way.
 */
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
