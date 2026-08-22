export const ARTICLE_TITLE_SLOT = "article-title";

/** Attribute rather than `data-slot`: these anchors are a Button `asChild`, and the child's props win. */
export const ARTICLE_NEIGHBOUR_ATTRIBUTE = "data-article-neighbour";
export const ARTICLE_PREVIOUS_CONTROL = `[${ARTICLE_NEIGHBOUR_ATTRIBUTE}="previous"]`;
export const ARTICLE_NEXT_CONTROL = `[${ARTICLE_NEIGHBOUR_ATTRIBUTE}="next"]`;

// Site header (48) + reader toolbar (44).
export const STICKY_CHROME_PX = 92;
