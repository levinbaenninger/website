"use client";

import { BriefcaseBusinessIcon, InfinityIcon } from "lucide-react";
import { Collapsible } from "radix-ui";
import { useRef } from "react";

import { Badge } from "@/shared/ui/badge";
import { ChevronsUpDownIcon } from "@/shared/ui/icons/chevrons-up-down-icon";
import type { ChevronsUpDownIconHandle } from "@/shared/ui/icons/chevrons-up-down-icon";
import { Separator } from "@/shared/ui/separator";

import { EXPERIENCE_CONTENT } from "./content";

export const ExperiencePositionItem = () => {
  const iconRef = useRef<ChevronsUpDownIconHandle>(null);

  return (
    <Collapsible.Root
      className="group/experience-position relative"
      onOpenChange={(open) => {
        if (open) {
          iconRef.current?.startAnimation();
        } else {
          iconRef.current?.stopAnimation();
        }
      }}
    >
      <div className="pointer-events-none absolute bottom-0 left-3 hidden size-4 bg-background group-last/experience-position:flex">
        <span className="size-full -translate-y-2.25 rounded-bl-sm border-b border-l" />
      </div>

      <Collapsible.Trigger className="group relative block w-full text-left outline-none before:absolute before:-inset-y-1 before:-right-1 before:left-7 before:-z-1 before:rounded-lg before:transition-colors hover:before:bg-accent focus-visible:before:ring-2 focus-visible:before:ring-ring/50">
        <div className="relative z-1 mb-1 flex items-start gap-3 text-base">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md border border-muted-foreground/15 bg-muted text-muted-foreground ring-1 ring-line ring-offset-1 ring-offset-background [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
            <BriefcaseBusinessIcon aria-hidden />
          </div>

          <h4 className="flex-1 font-medium text-balance">
            {EXPERIENCE_CONTENT.role}
          </h4>

          <ChevronsUpDownIcon
            ref={iconRef}
            className="shrink-0 text-muted-foreground"
            duration={0.15}
          />
        </div>

        <dl className="flex items-center gap-2 pl-9 text-sm text-muted-foreground">
          <div>
            <dt className="sr-only">Employment type</dt>
            <dd>{EXPERIENCE_CONTENT.employmentType}</dd>
          </div>

          <Separator className="h-4 self-center" orientation="vertical" />

          <div>
            <dt className="sr-only">Employment period</dt>
            <dd className="flex items-center gap-0.5 tabular-nums [&_svg]:size-4.5">
              <span>{EXPERIENCE_CONTENT.startDate}</span>
              <span className="font-mono">—</span>
              <InfinityIcon aria-label="Present" strokeWidth={1.5} />
            </dd>
          </div>

          <Separator className="h-4 self-center" orientation="vertical" />

          <div>
            <dt className="sr-only">Duration</dt>
            <dd className="tabular-nums">{EXPERIENCE_CONTENT.duration}</dd>
          </div>
        </dl>
      </Collapsible.Trigger>

      <Collapsible.Content className="overflow-hidden">
        <p className="pt-2 pl-9 text-sm/6 text-muted-foreground">
          {EXPERIENCE_CONTENT.description}
        </p>
      </Collapsible.Content>

      <ul className="flex flex-wrap gap-1.5 pt-3 pl-9">
        {EXPERIENCE_CONTENT.skills.map((skill) => (
          <li className="flex" key={skill}>
            <Badge variant="secondary">{skill}</Badge>
          </li>
        ))}
      </ul>
    </Collapsible.Root>
  );
};
