import { fileURLToPath } from "node:url";

import type { CompileOptions } from "@mdx-js/mdx";

import type { ArticleCodeThemes } from "./code-theme-contract.ts";

type ArticleMdxProcessorOptions = Pick<
  CompileOptions,
  "rehypePlugins" | "remarkPlugins"
>;

interface ArticleMdxPlugins<
  TCodePlugin,
  TContractPlugin,
  TFrontmatterPlugin,
  TGfmPlugin,
  TMdxFrontmatterPlugin,
> {
  readonly articleCode: TCodePlugin;
  readonly articleContract: TContractPlugin;
  readonly remarkFrontmatter: TFrontmatterPlugin;
  readonly remarkGfm: TGfmPlugin;
  readonly remarkMdxFrontmatter: TMdxFrontmatterPlugin;
}

const articleContractPlugin = fileURLToPath(
  new URL("contract.ts", import.meta.url)
);
const articleCodePlugin = fileURLToPath(new URL("code.ts", import.meta.url));

const createArticleProcessorOptions = <
  TCodePlugin,
  TContractPlugin,
  TFrontmatterPlugin,
  TGfmPlugin,
  TMdxFrontmatterPlugin,
>(
  themes: ArticleCodeThemes,
  plugins: ArticleMdxPlugins<
    TCodePlugin,
    TContractPlugin,
    TFrontmatterPlugin,
    TGfmPlugin,
    TMdxFrontmatterPlugin
  >
) => ({
  rehypePlugins: [
    [plugins.articleCode, { themes }] satisfies [
      TCodePlugin,
      { themes: ArticleCodeThemes },
    ],
  ],
  remarkPlugins: [
    plugins.remarkFrontmatter,
    plugins.remarkMdxFrontmatter,
    plugins.remarkGfm,
    plugins.articleContract,
  ],
});

export const createArticleMdxOptions = (themes: ArticleCodeThemes) =>
  createArticleProcessorOptions(themes, {
    articleCode: articleCodePlugin,
    articleContract: articleContractPlugin,
    remarkFrontmatter: "remark-frontmatter",
    remarkGfm: "remark-gfm",
    remarkMdxFrontmatter: "remark-mdx-frontmatter",
  });

export const loadArticleMdxProcessorOptions = async (
  themes: ArticleCodeThemes
): Promise<ArticleMdxProcessorOptions> => {
  const [
    { default: articleCode },
    { default: articleContract },
    { default: remarkFrontmatter },
    { default: remarkGfm },
    { default: remarkMdxFrontmatter },
  ] = await Promise.all([
    import("./code.ts"),
    import("./contract.ts"),
    import("remark-frontmatter"),
    import("remark-gfm"),
    import("remark-mdx-frontmatter"),
  ]);

  return createArticleProcessorOptions(themes, {
    articleCode,
    articleContract,
    remarkFrontmatter,
    remarkGfm,
    remarkMdxFrontmatter,
  });
};
