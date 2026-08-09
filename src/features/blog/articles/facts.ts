export interface ArticleHeadingFact {
  /** The Article outline is depth two through four; the title supplies the h1. */
  readonly depth: 2 | 3 | 4;
  readonly id: string;
  readonly text: string;
}

export interface ArticleLinkFact {
  readonly href: string;
}

export interface ArticleCompilationFacts {
  readonly headings: readonly ArticleHeadingFact[];
  readonly links: readonly ArticleLinkFact[];
  readonly searchText: string;
}
