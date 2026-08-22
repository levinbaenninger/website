declare module "*.mdx" {
  import type { MDXContent } from "mdx/types";

  import type { ArticleCompilationFacts } from "@/features/blog/articles/facts";

  export const __articleFacts: ArticleCompilationFacts;
  export const frontmatter: unknown;

  const Content: MDXContent;
  export default Content;
}
