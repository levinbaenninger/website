"use client";

import {
  createContext,
  Fragment,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { Temporal } from "temporal-polyfill";

import { cn } from "@/shared/ui/cn";

export interface Activity {
  date: string;
  count: number;
  level: number;
}

type Week = (Activity | undefined)[];
type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Labels {
  months?: string[];
  weekdays?: string[];
  totalCount?: string;
  legend?: {
    less?: string;
    more?: string;
  };
}

interface MonthLabel {
  weekIndex: number;
  label: string;
}

const DEFAULT_MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DEFAULT_LABELS: Labels = {
  months: DEFAULT_MONTH_LABELS,
  weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  totalCount: "{{count}} activities {{period}}",
  legend: {
    less: "Less",
    more: "More",
  },
};

const THEME = cn(
  'data-[level="0"]:fill-muted-foreground/5',
  'data-[level="1"]:fill-muted-foreground/20',
  'data-[level="2"]:fill-muted-foreground/40',
  'data-[level="3"]:fill-muted-foreground/60',
  'data-[level="4"]:fill-muted-foreground/80'
);

const parseActivityDate = (date: string) => Temporal.PlainDate.from(date);

const getActivityPeriodLabel = (activities: Activity[]): string => {
  let start = activities[0].date;
  let end = start;

  for (const { date } of activities) {
    if (date < start) {
      start = date;
    }

    if (date > end) {
      end = date;
    }
  }

  const startDate = parseActivityDate(start);
  const endDate = parseActivityDate(end);

  if (startDate.year === endDate.year) {
    return `in ${startDate.year}`;
  }

  const formatDate = (date: Temporal.PlainDate): string =>
    `${DEFAULT_MONTH_LABELS[date.month - 1]} ${date.day}, ${date.year}`;

  return `from ${formatDate(startDate)} to ${formatDate(endDate)}`;
};

interface ContributionGraphContextType {
  data: Activity[];
  weeks: Week[];
  blockMargin: number;
  blockRadius: number;
  blockSize: number;
  fontSize: number;
  labels: Labels;
  labelHeight: number;
  maxLevel: number;
  totalCount: number;
  weekStart: WeekDay;
  periodLabel: string;
  width: number;
  height: number;
}

const ContributionGraphContext =
  createContext<ContributionGraphContextType | null>(null);

const useContributionGraph = () => {
  const context = useContext(ContributionGraphContext);

  if (!context) {
    throw new Error(
      "ContributionGraph components must be used within a ContributionGraph"
    );
  }

  return context;
};

const fillHoles = (activities: Activity[]): Activity[] => {
  if (activities.length === 0) {
    return [];
  }

  const sortedActivities = [...activities].toSorted((a, b) =>
    a.date.localeCompare(b.date)
  );

  const calendar = new Map<string, Activity>(
    activities.map((a) => [a.date, a])
  );

  const [firstActivity] = sortedActivities;
  const lastActivity = sortedActivities.at(-1);

  if (!lastActivity) {
    return [];
  }

  const firstDate = parseActivityDate(firstActivity.date);
  const lastDate = parseActivityDate(lastActivity.date);
  const numberOfDays = firstDate.until(lastDate).days + 1;

  return Array.from({ length: numberOfDays }, (_, dayIndex) => {
    const date = firstDate.add({ days: dayIndex }).toString();

    const activity = calendar.get(date);

    if (activity !== undefined) {
      return activity;
    }

    return {
      date,
      count: 0,
      level: 0,
    };
  });
};

const groupByWeeks = (
  activities: Activity[],
  weekStart: WeekDay = 0
): Week[] => {
  if (activities.length === 0) {
    return [];
  }

  const normalizedActivities = fillHoles(activities);
  const [firstActivity] = normalizedActivities;
  const firstDate = parseActivityDate(firstActivity.date);
  const sundayBasedDay = firstDate.dayOfWeek % 7;
  const paddingDays = (sundayBasedDay - weekStart + 7) % 7;

  const paddedActivities = [
    ...Array.from(
      { length: paddingDays },
      (): Activity | undefined => undefined
    ),
    ...normalizedActivities,
  ];

  const numberOfWeeks = Math.ceil(paddedActivities.length / 7);

  return Array.from({ length: numberOfWeeks }, (_, weekIndex) =>
    paddedActivities.slice(weekIndex * 7, weekIndex * 7 + 7)
  );
};

const getMonthLabels = (
  weeks: Week[],
  monthNames: string[] = DEFAULT_MONTH_LABELS
): MonthLabel[] => {
  const labels: MonthLabel[] = [];

  for (const [weekIndex, week] of weeks.entries()) {
    const firstActivity = week.find((activity) => activity !== undefined);

    if (!firstActivity) {
      throw new Error(
        `Unexpected error: Week ${weekIndex + 1} is empty: ${JSON.stringify(week)}.`
      );
    }

    const firstDate = parseActivityDate(firstActivity.date);
    const month = monthNames[firstDate.month - 1];

    if (!month) {
      throw new Error(
        `Unexpected error: undefined month label for month ${firstDate.month}.`
      );
    }

    const prevLabel = labels.at(-1);

    if (weekIndex === 0 || !prevLabel || prevLabel.label !== month) {
      labels.push({ weekIndex, label: month });
    }
  }

  return labels.filter(({ weekIndex }, index) => {
    const minWeeks = 3;

    if (index === 0) {
      const [, nextLabel] = labels;
      return (
        nextLabel !== undefined && nextLabel.weekIndex - weekIndex >= minWeeks
      );
    }

    if (index === labels.length - 1) {
      return weeks.slice(weekIndex).length >= minWeeks;
    }

    return true;
  });
};

export type ContributionGraphProps = HTMLAttributes<HTMLDivElement> & {
  data: Activity[];
  blockMargin?: number;
  blockRadius?: number;
  blockSize?: number;
  fontSize?: number;
  labels?: Labels;
  maxLevel?: number;
  style?: CSSProperties;
  totalCount?: number;
  weekStart?: WeekDay;
  children: ReactNode;
  className?: string;
};

export const ContributionGraph = ({
  data,
  blockMargin = 4,
  blockRadius = 2,
  blockSize = 12,
  fontSize = 14,
  labels: labelsProp,
  maxLevel: maxLevelProp = 4,
  style,
  totalCount: totalCountProp,
  weekStart = 0,
  className,
  ...props
}: ContributionGraphProps) => {
  const maxLevel = Math.max(1, maxLevelProp);
  const weeks = useMemo(() => groupByWeeks(data, weekStart), [data, weekStart]);
  const LABEL_MARGIN = 8;

  const labels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...labelsProp }),
    [labelsProp]
  );
  const labelHeight = fontSize + LABEL_MARGIN;

  const periodLabel = data.length > 0 ? getActivityPeriodLabel(data) : "";

  const totalCount =
    totalCountProp ?? data.reduce((sum, activity) => sum + activity.count, 0);

  const width = weeks.length * (blockSize + blockMargin) - blockMargin;
  const height = labelHeight + (blockSize + blockMargin) * 7 - blockMargin;

  const contextValue = useMemo(
    () => ({
      data,
      weeks,
      blockMargin,
      blockRadius,
      blockSize,
      fontSize,
      labels,
      labelHeight,
      maxLevel,
      totalCount,
      weekStart,
      periodLabel,
      width,
      height,
    }),
    [
      data,
      weeks,
      blockMargin,
      blockRadius,
      blockSize,
      fontSize,
      labels,
      labelHeight,
      maxLevel,
      totalCount,
      weekStart,
      periodLabel,
      width,
      height,
    ]
  );

  if (data.length === 0) {
    return null;
  }

  return (
    <ContributionGraphContext.Provider value={contextValue}>
      <div
        className={cn("flex w-max max-w-full flex-col gap-2", className)}
        style={{ fontSize, ...style }}
        {...props}
      />
    </ContributionGraphContext.Provider>
  );
};

export type ContributionGraphBlockProps = HTMLAttributes<SVGRectElement> & {
  activity: Activity;
  dayIndex: number;
  weekIndex: number;
};

export const ContributionGraphBlock = ({
  activity,
  dayIndex,
  weekIndex,
  className,
  ...props
}: ContributionGraphBlockProps) => {
  const { blockSize, blockMargin, blockRadius, labelHeight, maxLevel } =
    useContributionGraph();

  if (activity.level < 0 || activity.level > maxLevel) {
    throw new RangeError(
      `Provided activity level ${activity.level} for ${activity.date} is out of range. It must be between 0 and ${maxLevel}.`
    );
  }

  return (
    <rect
      className={cn(THEME, className)}
      data-count={activity.count}
      data-date={activity.date}
      data-level={activity.level}
      height={blockSize}
      rx={blockRadius}
      ry={blockRadius}
      width={blockSize}
      x={(blockSize + blockMargin) * weekIndex}
      y={labelHeight + (blockSize + blockMargin) * dayIndex}
      {...props}
    />
  );
};

export type ContributionGraphCalendarProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  hideMonthLabels?: boolean;
  className?: string;
  children: (props: {
    activity: Activity;
    dayIndex: number;
    weekIndex: number;
  }) => ReactNode;
};

export const ContributionGraphCalendar = ({
  title = "Contribution Graph",
  hideMonthLabels = false,
  className,
  children,
  ...props
}: ContributionGraphCalendarProps) => {
  const { weeks, width, height, blockSize, blockMargin, labels } =
    useContributionGraph();
  const scrollRef = useRef<HTMLDivElement>(null);

  const monthLabels = useMemo(
    () => getMonthLabels(weeks, labels.months),
    [weeks, labels.months]
  );

  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }

    node.scrollLeft = node.scrollWidth - node.clientWidth;
  }, [width, weeks.length]);

  return (
    <div
      className={cn(
        "no-scrollbar max-w-full scroll-fade-x overflow-x-auto overflow-y-hidden",
        className
      )}
      {...props}
      ref={scrollRef}
    >
      <svg
        className="block overflow-visible"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
      >
        <title>{title}</title>
        {!hideMonthLabels && (
          <g
            data-slot="month-labels"
            className="fill-current selection:fill-selection-foreground"
          >
            {monthLabels.map(({ label, weekIndex }) => (
              <text
                dominantBaseline="hanging"
                key={weekIndex}
                x={(blockSize + blockMargin) * weekIndex}
              >
                {label}
              </text>
            ))}
          </g>
        )}
        {weeks.map((week, weekIndex) =>
          week.map((activity, dayIndex) => {
            if (!activity) {
              return null;
            }

            return (
              <Fragment key={`${weekIndex}-${dayIndex}`}>
                {children({ activity, dayIndex, weekIndex })}
              </Fragment>
            );
          })
        )}
      </svg>
    </div>
  );
};

export type ContributionGraphFooterProps = HTMLAttributes<HTMLDivElement>;

export const ContributionGraphFooter = ({
  className,
  ...props
}: ContributionGraphFooterProps) => (
  <div
    className={cn(
      "flex flex-wrap gap-1 whitespace-nowrap sm:gap-x-4",
      className
    )}
    {...props}
  />
);

export type ContributionGraphTotalCountProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  children?: (props: { periodLabel: string; totalCount: number }) => ReactNode;
};

export const ContributionGraphTotalCount = ({
  className,
  children,
  ...props
}: ContributionGraphTotalCountProps) => {
  const { totalCount, periodLabel, labels } = useContributionGraph();

  if (children) {
    return <>{children({ periodLabel, totalCount })}</>;
  }

  return (
    <div className={cn("text-muted-foreground", className)} {...props}>
      {labels.totalCount !== undefined && labels.totalCount !== ""
        ? labels.totalCount
            .replace("{{count}}", String(totalCount))
            .replace("{{period}}", periodLabel)
        : `${totalCount} activities ${periodLabel}`}
    </div>
  );
};

export type ContributionGraphLegendProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  children?: (props: { level: number }) => ReactNode;
};

export const ContributionGraphLegend = ({
  className,
  children,
  ...props
}: ContributionGraphLegendProps) => {
  const { labels, maxLevel, blockSize, blockRadius, blockMargin } =
    useContributionGraph();
  const lessLabel = labels.legend?.less;
  const moreLabel = labels.legend?.more;

  return (
    <div
      className={cn("ml-auto flex items-center", className)}
      style={{ gap: blockMargin }}
      {...props}
    >
      <span className="mr-1 text-muted-foreground">
        {lessLabel !== undefined && lessLabel !== "" ? lessLabel : "Less"}
      </span>

      {Array.from({ length: maxLevel + 1 }, (_, level) =>
        children ? (
          <Fragment key={level}>{children({ level })}</Fragment>
        ) : (
          <svg height={blockSize} key={level} width={blockSize}>
            <title>{`${level} contributions`}</title>
            <rect
              className={cn(THEME)}
              data-level={level}
              height={blockSize}
              rx={blockRadius}
              ry={blockRadius}
              width={blockSize}
            />
          </svg>
        )
      )}

      <span className="ml-1 text-muted-foreground">
        {moreLabel !== undefined && moreLabel !== "" ? moreLabel : "More"}
      </span>
    </div>
  );
};
