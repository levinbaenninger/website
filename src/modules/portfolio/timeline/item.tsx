"use client";

import type { ReactElement, ReactNode } from "react";
import { useRef } from "react";
import ReactMarkdown from "react-markdown";

import { Badge } from "@/shared/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import { ChevronsUpDownIcon } from "@/shared/ui/icons/chevrons-up-down-icon";
import type { ChevronsUpDownIconHandle } from "@/shared/ui/icons/chevrons-up-down-icon";

export const TimelineItem = ({
  actions,
  children,
  description,
  heading,
  icon,
  tags,
}: {
  actions?: ReactElement;
  children: ReactNode;
  description: string;
  heading: ReactNode;
  icon: ReactNode;
  tags?: readonly string[];
}) => {
  const iconRef = useRef<ChevronsUpDownIconHandle>(null);

  return (
    <Collapsible
      className="group/timeline-item relative"
      onOpenChange={(open) => {
        if (open) {
          iconRef.current?.startAnimation();
        } else {
          iconRef.current?.stopAnimation();
        }
      }}
    >
      <div className="pointer-events-none absolute bottom-0 left-3 hidden size-4 bg-background group-last/timeline-item:flex">
        <span className="size-full -translate-y-2.25 rounded-bl-sm border-b border-l" />
      </div>

      <CollapsibleTrigger className="group relative block w-full text-left outline-none before:absolute before:-inset-y-1 before:-right-1 before:left-7 before:-z-1 before:rounded-lg before:transition-colors hover:before:bg-accent focus-visible:before:ring-2 focus-visible:before:ring-ring/50">
        <div className="relative z-1 mb-1 flex items-start gap-3 text-base">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md border border-muted-foreground/15 bg-muted text-muted-foreground ring-1 ring-line ring-offset-1 ring-offset-background [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
            {icon}
          </div>

          <div className="min-w-0 flex-1">{heading}</div>

          <ChevronsUpDownIcon
            ref={iconRef}
            className="shrink-0 text-muted-foreground"
            duration={0.15}
          />
        </div>

        {children}
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden">
        <div className="typeset pt-2 pl-9 [--color-foreground:var(--color-muted-foreground)] [--typeset-leading:1.5] [--typeset-size:0.875rem]">
          <ReactMarkdown skipHtml>{description}</ReactMarkdown>
        </div>
      </CollapsibleContent>

      {(tags && tags.length > 0) || actions !== undefined ? (
        <div className="flex flex-wrap items-center gap-2 pt-3 pl-9">
          {tags && tags.length > 0 ? (
            <ul className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {tags.map((tag) => (
                <li className="flex" key={tag}>
                  <Badge variant="secondary">{tag}</Badge>
                </li>
              ))}
            </ul>
          ) : null}

          {actions === undefined ? null : (
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              {actions}
            </div>
          )}
        </div>
      ) : null}
    </Collapsible>
  );
};
