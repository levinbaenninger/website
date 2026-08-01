// PROTOTYPE — throwaway. Delete this directory once issue #34 is decided.
//
// The heading's copy-link control. Its own client module so the heading itself
// can stay a server component: `CopyButton` accepts a lazy `text` callback, and
// a callback cannot cross the server/client boundary as a prop.

"use client";

import { LinkIcon } from "lucide-react";

import { CopyButton } from "@/shared/ui/copy-button";

const headingUrl = (id: string): string => {
  const url = new URL(window.location.href);
  url.hash = id;
  return url.toString();
};

export const HeadingCopyLink = ({ id }: { readonly id: string }) => (
  <CopyButton
    aria-label="Copy link to section"
    className="size-7 border-none"
    data-heading-copy=""
    idleIcon={<LinkIcon aria-hidden />}
    text={() => headingUrl(id)}
    variant="ghost"
  />
);
