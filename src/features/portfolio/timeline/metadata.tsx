import { InfinityIcon } from "lucide-react";
import type { ReactNode } from "react";

export const TimelineMetadata = ({ children }: { children: ReactNode }) => (
  <dl className="flex flex-wrap items-center gap-y-1 pl-9 text-sm text-muted-foreground">
    {children}
  </dl>
);

export const TimelineMetadataItem = ({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) => (
  <div className="mr-2 border-l pl-2 first:border-l-0 first:pl-0">
    <dt className="sr-only">{label}</dt>
    <dd>{children}</dd>
  </div>
);

export const TimelinePeriod = ({
  endDate,
  label,
  startDate,
}: {
  endDate: string | null;
  label: string;
  startDate: string;
}) => (
  <TimelineMetadataItem label={label}>
    <span className="flex items-center gap-0.5 tabular-nums [&_svg]:size-4.5">
      <span>{startDate}</span>
      <span className="font-mono">—</span>
      {endDate === null ? (
        <InfinityIcon aria-label="Present" strokeWidth={1.5} />
      ) : (
        <span>{endDate}</span>
      )}
    </span>
  </TimelineMetadataItem>
);
