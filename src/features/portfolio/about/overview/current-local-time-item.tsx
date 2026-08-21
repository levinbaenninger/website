"use client";

import { ClockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Temporal } from "temporal-polyfill";

import {
  OverviewItem,
  OverviewItemContent,
  OverviewItemIcon,
} from "./overview-item";

export const getClock = (
  timeZone: string,
  now = Temporal.Now.instant(),
  viewerTimeZone = Temporal.Now.timeZoneId()
) => {
  const offsetHours =
    (now.toZonedDateTimeISO(timeZone).offsetNanoseconds -
      now.toZonedDateTimeISO(viewerTimeZone).offsetNanoseconds) /
    3_600_000_000_000;

  const time = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: true,
    minute: "2-digit",
    timeZone,
  }).format(now.epochMilliseconds);

  if (offsetHours === 0) {
    return { difference: " // same time", time };
  }

  const hours = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Math.abs(offsetHours));
  const direction = offsetHours > 0 ? "ahead" : "behind";

  return { difference: ` // ${hours}h ${direction}`, time };
};

export const CurrentLocalTimeItem = ({ timeZone }: { timeZone: string }) => {
  const [clock, setClock] = useState<ReturnType<typeof getClock> | null>(null);

  useEffect(() => {
    const updateClock = () => {
      setClock(getClock(timeZone));
    };

    updateClock();
    const interval = window.setInterval(updateClock, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [timeZone]);

  return (
    <OverviewItem>
      <OverviewItemIcon>
        <ClockIcon />
      </OverviewItemIcon>
      <OverviewItemContent>
        {clock ? (
          <>
            <span>{clock.time}</span>
            <span className="text-muted-foreground" aria-hidden>
              {clock.difference}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">Calculating…</span>
        )}
      </OverviewItemContent>
    </OverviewItem>
  );
};
