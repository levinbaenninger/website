import { CopyButton } from "@/shared/ui/copy-button";

export const ArticleCopyButton = ({ source }: { readonly source: string }) => (
  <CopyButton
    aria-label="Copy code"
    className="size-7 border-none"
    data-article-code-copy=""
    text={source}
    variant="ghost"
  />
);
