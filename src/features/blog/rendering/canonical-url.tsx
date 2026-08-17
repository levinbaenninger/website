"use client";

// Canonical URL is rendering input, not window.location: a preview URL or leftover
// query must not land in a copied section link. The MDX registry is a frozen
// singleton, so the value travels as context. null is the Draft / no-provider case.

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
