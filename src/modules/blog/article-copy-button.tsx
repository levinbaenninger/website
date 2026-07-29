"use client";

interface ArticleCopyButtonProps {
  readonly source: string;
}

export const ArticleCopyButton = ({ source }: ArticleCopyButtonProps) => (
  <button
    aria-label="Copy code"
    onClick={() => {
      void navigator.clipboard.writeText(source);
    }}
    type="button"
  >
    Copy
  </button>
);
