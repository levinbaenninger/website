import { ArticleBody } from "@/modules/blog/rendering/body";

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
import type { ArticleDetail } from "./types";

interface ArticleViewProps {
  readonly article: ArticleDetail;
  /**
   * The absolute canonical Article URL, supplied by the app because origin is
   * app-owned. `null` withholds the public section-copy controls, which is the
   * local Draft case.
   */
  readonly canonicalUrl?: string | null;
}

/**
 * The Article reader.
 *
 * Everything a visitor needs in order to read the Article and leave it is
 * server-rendered: the header, the compiled body, the Blog link, both
 * neighbour links, and the end pager. The toolbar's copy of the title is the
 * only element that hydrates, because a scroll position is the one fact the
 * server does not have.
 *
 * Neighbour links are ordinary route links, which is also what starts the
 * destination Article at the top: from anywhere past the fold the destination's
 * first element is outside the viewport, so Next.js scrolls to it, while
 * browser Back and Forward keep their own restored positions. Nothing here
 * stores navigation history of its own.
 */
export const ArticleView = ({
  article,
  canonicalUrl = null,
}: ArticleViewProps) => {
  const { Content, navigation } = article;

  return (
    <article className="flex flex-1 flex-col">
      <ReaderRail>
        <ReaderTopLine />
      </ReaderRail>

      <ReaderToolbar navigation={navigation} title={article.title} />

      <ReaderRail>
        <ArticleHeader article={article} />
      </ReaderRail>

      <ReaderGrid>
        <ReaderRail>
          <ProseColumn>
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
