"use client";

// Own client module so the heading stays a server component. Renders nothing without a canonical URL.

import { LinkIcon } from "lucide-react";

import { CopyButton } from "@/shared/ui/copy-button";

import { useArticleCanonicalUrl } from "./canonical-url";

export const ArticleHeadingCopyLink = ({ id }: { readonly id: string }) => {
  const canonicalUrl = useArticleCanonicalUrl();

  if (canonicalUrl === null) {
    return null;
  }

  return (
    <CopyButton
      aria-label="Copy link to section"
      className="size-7 border-none"
      data-article-heading-copy=""
      idleIcon={<LinkIcon aria-hidden />}
      text={`${canonicalUrl}#${id}`}
      variant="ghost"
    />
  );
};
