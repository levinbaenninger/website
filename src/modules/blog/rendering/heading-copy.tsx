"use client";

// The heading's "Copy link to section" control.
//
// Its own client module so the heading itself stays a server component: only
// this leaf reads the canonical URL and only this leaf hydrates.
//
// It renders nothing without a canonical Article URL, which is exactly the local
// Draft case — an unpublished Article has no public section to link to. The
// heading keeps its native fragment link either way, so navigating within a
// Draft still works.

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
