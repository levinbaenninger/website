import type { ReactNode } from "react";

import { Button } from "@/shared/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

export const TimelineExternalAction = ({
  children,
  href,
  label,
}: {
  children: ReactNode;
  href: string;
  label: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button asChild size="icon-sm" variant="outline">
        <a
          aria-label={label}
          href={href}
          rel="noopener noreferrer"
          target="_blank"
        >
          {children}
        </a>
      </Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);
