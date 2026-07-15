"use client";

import { format } from "date-fns";
import { use } from "react";

import { cn } from "@/shared/ui/cn";
import { Spinner } from "@/shared/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import type { Activity } from "./contribution-graph";
import {
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
  ContributionGraphFooter,
  ContributionGraphLegend,
  ContributionGraphTotalCount,
} from "./contribution-graph";
import type { ContributionsResult } from "./get-contributions";

export const GitHubContributions = ({
  contributions,
  githubProfileUrl,
  className,
}: {
  contributions: Promise<ContributionsResult>;
  githubProfileUrl: string;
  className?: string;
}) => {
  const result = use(contributions);

  if (result.status === "unavailable") {
    return (
      <div className="flex h-40.5 w-full items-center justify-center px-4 text-center font-mono text-sm text-muted-foreground">
        Contributions unavailable.
      </div>
    );
  }

  const data: Activity[] = result.contributions;

  return (
    <ContributionGraph
      className={cn("mx-auto py-2", className)}
      data={data}
      blockSize={11}
      blockMargin={3}
      blockRadius={2}
    >
      <ContributionGraphCalendar
        className="no-scrollbar px-2"
        title="GitHub Contributions"
      >
        {({ activity, dayIndex, weekIndex }) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <g>
                <ContributionGraphBlock
                  activity={activity}
                  dayIndex={dayIndex}
                  weekIndex={weekIndex}
                />
              </g>
            </TooltipTrigger>
            <TooltipContent className="font-sans">
              <p>
                {activity.count} contribution{activity.count > 1 ? "s" : null}{" "}
                on {format(new Date(activity.date), "dd.MM.yyyy")}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </ContributionGraphCalendar>

      <ContributionGraphFooter className="px-2">
        <ContributionGraphTotalCount>
          {({ totalCount, year }) => (
            <div className="text-muted-foreground">
              {totalCount.toLocaleString("en")} contributions in {year} on{" "}
              <a
                className="text-foreground underline decoration-current/30 decoration-1 underline-offset-3 transition-colors hover:decoration-current"
                href={githubProfileUrl}
                target="_blank"
                rel="noopener"
              >
                GitHub
              </a>
              .
            </div>
          )}
        </ContributionGraphTotalCount>

        <ContributionGraphLegend />
      </ContributionGraphFooter>
    </ContributionGraph>
  );
};

export const GitHubContributionsFallback = () => (
  <div className="flex h-40.5 w-full items-center justify-center">
    <Spinner className="text-muted-foreground" />
  </div>
);
