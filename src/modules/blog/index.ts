export { getArticleMdxComponents } from "./rendering/mdx-components";
export { BLOG_SOCIAL_IMAGE } from "./social-image";
export { BlogView } from "./catalog/view";
// PROTOTYPE — issue #32. Remove these three exports together with
// ./catalog/prototype once a catalog composition is chosen.
export {
  isAlignment,
  isCardLayout,
  isPrototypeState,
  isSnippetMode,
  isVariantKey,
} from "./catalog/prototype/params";
export type {
  Alignment,
  CardLayout,
  PrototypeState,
  SnippetMode,
  VariantKey,
} from "./catalog/prototype/params";
export { BlogCatalogPrototype } from "./catalog/prototype/prototype-view";

// PROTOTYPE — issue #33. Remove these two exports together with
// `articles/prototype/` once a reader composition is chosen.
export { readPrototypeSelection } from "./articles/prototype/params";
export { ArticleReaderPrototype } from "./articles/prototype/view";

// PROTOTYPE — issue #34. Remove these two exports together with
// `rendering/prototype/` once a presentation language is chosen.
export { readLanguageSelection } from "./rendering/prototype/params";
export { ArticleLanguagePrototype } from "./rendering/prototype/view";
