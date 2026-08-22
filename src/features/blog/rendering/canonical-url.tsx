"use client";

// Not window.location: a preview URL must not land in a copied section link. Context because the MDX registry is a frozen singleton.

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
