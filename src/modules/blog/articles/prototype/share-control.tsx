// PROTOTYPE — throwaway. Delete this directory once issue #33 is decided.
//
// Three ways to hand a reader the Article's URL. The menu is the reference
// surface (ncdai/chanhdai.com @ 83e0b842, `doc-share-menu.tsx`, MIT, © Chánh
// Đại); the other two exist so the menu can be judged against something.

"use client";

import { CheckIcon, LinkIcon, ShareIcon } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/ui/cn";
import { CopyButton } from "@/shared/ui/copy-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { LinkedInIcon } from "@/shared/ui/icons/linkedin-icon";
import { XIcon } from "@/shared/ui/icons/x-icon";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import type { ShareSurface } from "./params";

interface ShareTarget {
  readonly href: (url: string, title: string) => string;
  readonly icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  readonly label: string;
}

// Each target carries its own mark, so the menu and the dialog stay one
// projection instead of drifting apart.
const SHARE_TARGETS: readonly ShareTarget[] = [
  {
    href: (url, title) =>
      `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    icon: XIcon,
    label: "Share on X",
  },
  {
    href: (url) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    icon: LinkedInIcon,
    label: "Share on LinkedIn",
  },
];

// Spreads so `asChild` triggers can hand it their props and ref.
const ShareTrigger = ({
  className,
  ...props
}: React.ComponentProps<typeof Button>) => (
  <Button
    aria-label="Share"
    className={cn("size-7 border-none", className)}
    size="icon-sm"
    variant="secondary"
    {...props}
  >
    {/* The box-with-an-arrow, not the three connected dots: it is what a share
        affordance looks like on every platform Levin's readers are on. */}
    <ShareIcon aria-hidden />
  </Button>
);

const MENU_ITEM =
  "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground [&_svg]:size-4 [&_svg]:text-muted-foreground";

/** Reference surface: a dropdown with copy plus the social intents. */
const ShareMenu = ({
  title,
  url,
}: {
  readonly title: string;
  readonly url: string;
}) => {
  const [copied, setCopied] = useState(false);

  return (
    <DropdownMenu.Root
      onOpenChange={(open) => {
        if (!open) {
          setCopied(false);
        }
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu.Trigger asChild>
            <ShareTrigger />
          </DropdownMenu.Trigger>
        </TooltipTrigger>
        <TooltipContent>Share</TooltipContent>
      </Tooltip>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-50 min-w-48 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-border duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0"
          sideOffset={8}
        >
          <DropdownMenu.Item
            className={MENU_ITEM}
            onSelect={(event) => {
              // The menu stays open so the label can confirm the copy.
              event.preventDefault();
              void (async () => {
                await navigator.clipboard.writeText(url);
                setCopied(true);
              })();
            }}
          >
            {copied ? <CheckIcon aria-hidden /> : <LinkIcon aria-hidden />}
            {copied ? "Copied" : "Copy link"}
          </DropdownMenu.Item>

          {SHARE_TARGETS.map(({ href, icon: Icon, label }) => (
            <DropdownMenu.Item asChild className={MENU_ITEM} key={label}>
              <a
                href={href(url, title)}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Icon aria-hidden />
                {label}
              </a>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

/** One button, one job: the link lands on the clipboard. */
const ShareCopy = ({ url }: { readonly url: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <CopyButton
        aria-label="Copy link to this Article"
        className="size-7 border-none"
        idleIcon={<LinkIcon aria-hidden />}
        text={url}
        variant="secondary"
      />
    </TooltipTrigger>
    <TooltipContent>Copy link</TooltipContent>
  </Tooltip>
);

/** The URL is visible and selectable before it is copied. */
const ShareDialog = ({
  title,
  url,
}: {
  readonly title: string;
  readonly url: string;
}) => (
  <Dialog>
    <Tooltip>
      <TooltipTrigger asChild>
        <DialogTrigger asChild>
          <ShareTrigger />
        </DialogTrigger>
      </TooltipTrigger>
      <TooltipContent>Share</TooltipContent>
    </Tooltip>

    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Share this Article</DialogTitle>
        <DialogDescription className="text-balance">{title}</DialogDescription>
      </DialogHeader>

      <InputGroup>
        <InputGroupInput readOnly value={url} />
        <InputGroupAddon align="inline-end">
          <CopyButton
            aria-label="Copy link to this Article"
            className="size-7"
            text={url}
            variant="ghost"
          />
        </InputGroupAddon>
      </InputGroup>

      <div className="flex flex-wrap gap-2">
        {SHARE_TARGETS.map(({ href, icon: Icon, label }) => (
          <Button asChild key={label} size="sm" variant="outline">
            <a
              href={href(url, title)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Icon aria-hidden />
              {label}
            </a>
          </Button>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);

export const ShareControl = ({
  surface,
  title,
  url,
}: {
  readonly surface: ShareSurface;
  readonly title: string;
  readonly url: string;
}) => {
  if (surface === "copy") {
    return <ShareCopy url={url} />;
  }

  if (surface === "dialog") {
    return <ShareDialog title={title} url={url} />;
  }

  return <ShareMenu title={title} url={url} />;
};
