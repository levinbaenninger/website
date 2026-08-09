"use client";

// The canonical Article URL, as rendering input rather than domain data.
//
// A section link has to name the Article the reader would share, not the URL
// the browser happens to be showing: a preview deployment, a trailing slash, or
// a leftover query parameter would all otherwise end up in a copied link. Origin
// is app-owned, so the app hands the resolved canonical URL down and the Article
// domain model never learns about it.
//
// The registry `getArticleMdxComponents()` returns is a frozen singleton shared
// by every Article, so the value cannot travel as a component prop. It travels
// as context instead: the provider is a client module whose children are still
// server-rendered, and only the leaf control that needs the value hydrates.
//
// `null` is the local Draft case and the no-provider case at once, which is what
// makes "Drafts omit the public section-copy action" one code path rather than a
// condition repeated at every call site.

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

const ArticleCanonicalUrlContext = createContext<string | null>(null);

interface ArticleCanonicalUrlProviderProps {
  readonly canonicalUrl: string | null;
  readonly children: ReactNode;
}

export const ArticleCanonicalUrlProvider = ({
  canonicalUrl,
  children,
}: ArticleCanonicalUrlProviderProps) => (
  <ArticleCanonicalUrlContext value={canonicalUrl}>
    {children}
  </ArticleCanonicalUrlContext>
);

export const useArticleCanonicalUrl = (): string | null =>
  useContext(ArticleCanonicalUrlContext);
