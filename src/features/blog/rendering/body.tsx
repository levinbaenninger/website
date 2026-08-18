// Import stylesheets here, not from globals.css, so Blog tokens stay out of the shell.

import type { ReactNode } from "react";

import "./article.css";
import "./code/code.css";
import { ArticleCanonicalUrlProvider } from "./canonical-url";

interface ArticleBodyProps {
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
