import { ChevronDownIcon } from "lucide-react";
import { Children } from "react";
import type { ReactNode } from "react";

import { Button } from "@/shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";

const DEFAULT_MAX_VISIBLE_ITEMS = 3;

export const TimelineList = ({
  children,
  max = DEFAULT_MAX_VISIBLE_ITEMS,
}: {
  children: ReactNode;
  max?: number;
}) => {
  const items = Children.toArray(children);
  const visibleCount = Math.max(0, max);
  const visibleItems = items.slice(0, visibleCount);
  const additionalItems = items.slice(visibleCount);

  return (
    <Collapsible className="group/collapsible">
      {visibleItems}

      <CollapsibleContent>{additionalItems}</CollapsibleContent>

      {additionalItems.length > 0 ? (
        <div className="screen-line-top -mt-px flex h-12 items-center justify-center">
          <CollapsibleTrigger asChild>
            <Button className="gap-2 pr-2.5 pl-3" size="sm" variant="secondary">
              <span className="hidden group-data-closed/collapsible:block">
                Show more
              </span>
              <span className="hidden group-data-open/collapsible:block">
                Show less
              </span>
              <ChevronDownIcon className="transition-transform group-data-open/collapsible:rotate-180" />
            </Button>
          </CollapsibleTrigger>
        </div>
      ) : null}
    </Collapsible>
  );
};
