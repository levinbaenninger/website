"use client";

import { LinkIcon } from "lucide-react";

import { cn } from "@/shared/ui/cn";
import type { CopyButtonProps } from "@/shared/ui/copy-button";
import { CopyButton } from "@/shared/ui/copy-button";

type PanelTitleCopyProps = Omit<CopyButtonProps, "id" | "text"> & {
  id: string;
};

const createHeadingUrl = (id: string) => {
  const url = new URL(window.location.href);
  url.hash = id;
  return url.toString();
};

export const PanelTitleCopy = ({
  id,
  className,
  ...props
}: PanelTitleCopyProps) => (
  <CopyButton
    className={cn(
      "ml-1 size-7 shrink-0 border-none align-middle text-muted-foreground opacity-100 transition-opacity motion-reduce:transition-none sm:opacity-0 sm:group-focus-within/panel-title:opacity-100 sm:group-hover/panel-title:opacity-100 sm:focus-visible:opacity-100",
      className
    )}
    variant="ghost"
    text={() => createHeadingUrl(id)}
    idleIcon={<LinkIcon aria-hidden />}
    aria-label="Copy link to section"
    {...props}
  />
);
