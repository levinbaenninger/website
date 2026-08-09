import { PenLineIcon } from "lucide-react";

import type {
  ArticleSummary,
  ArticleTagFacet,
} from "@/features/blog/articles/types";

import { CatalogEmpty } from "./catalog-empty";
import { PageHeading } from "./chrome";
import { CatalogDiscovery } from "./discovery";

const BLOG_TAGLINE = "Blog";

// Kept beside the presentation it belongs to rather than imported from the
// app's metadata: Blog owns its own copy, and the module cannot reach into app.
const BLOG_TITLE =
  "Writing about nerdy stuff—mostly software, the web, and whatever else catches my attention.";

interface BlogViewProps {
  readonly articles: readonly ArticleSummary[];
  readonly tags: readonly ArticleTagFacet[];
}

/**
 * The Blog catalog.
 *
 * Everything a visitor needs in order to find and open an Article is rendered
 * on the server: the heading, every card, and every Article link. The
 * discovery island layers Tag filtering on top once the client takes over.
 *
 * An empty catalog drops the discovery controls entirely — there is nothing to
 * search or filter — and puts the zero state directly under the heading.
 */
export const BlogView = ({ articles, tags }: BlogViewProps) => (
  <div className="mx-auto w-full border-x border-line pt-12 pb-4 md:w-3xl">
    <PageHeading tagline={BLOG_TAGLINE} title={BLOG_TITLE} />

    {articles.length === 0 ? (
      <CatalogEmpty
        description="New writing will turn up here."
        media={<PenLineIcon aria-hidden />}
        title="Fresh page, no ink yet"
      />
    ) : (
      <>
        <div className="h-4" />

        <noscript>
          <p className="screen-line-top screen-line-bottom p-4 text-sm text-muted-foreground">
            Article search and Tag filtering need JavaScript. Every Article is
            listed below.
          </p>
        </noscript>

        <CatalogDiscovery articles={articles} tags={tags} />
      </>
    )}
  </div>
);
