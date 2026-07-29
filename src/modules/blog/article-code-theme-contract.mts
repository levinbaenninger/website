export const ARTICLE_CODE_THEMES = [
  "github-dark",
  "github-light",
  "vitesse-dark",
  "vitesse-light",
] as const;

export type ArticleCodeTheme = (typeof ARTICLE_CODE_THEMES)[number];

export interface ArticleCodeThemes {
  readonly dark: ArticleCodeTheme;
  readonly light: ArticleCodeTheme;
}

export const isArticleCodeTheme = (value: string): value is ArticleCodeTheme =>
  ARTICLE_CODE_THEMES.some((theme) => theme === value);
