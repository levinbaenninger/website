export interface ArticleHeadingFact {
  readonly depth: 2 | 3 | 4 | 5 | 6;
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
