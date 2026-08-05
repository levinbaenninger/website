// The Article body scope.
//
// One element carries three things: the `.typeset` prose foundation, the
// `data-slot="article-body"` hook every rule in `article.css` is written
// against, and the canonical URL the section-copy controls read. Importing the
// stylesheet here rather than from `globals.css` is what keeps the Blog's
// presentation tokens out of the shell's contract.

import type { ReactNode } from "react";

import "./article.css";
import { ArticleCanonicalUrlProvider } from "./canonical-url";

interface ArticleBodyProps {
  /** The absolute canonical Article URL, or `null` for a local Draft. */
  readonly canonicalUrl: string | null;
  readonly children: ReactNode;
}

export const ArticleBody = ({ canonicalUrl, children }: ArticleBodyProps) => (
  <ArticleCanonicalUrlProvider canonicalUrl={canonicalUrl}>
    <div className="typeset" data-slot="article-body">
      {children}
    </div>
  </ArticleCanonicalUrlProvider>
);
