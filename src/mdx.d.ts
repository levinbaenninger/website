declare module "*.mdx" {
  import type { MDXContent } from "mdx/types";

  export const frontmatter: unknown;

  const Content: MDXContent;
  export default Content;
}
