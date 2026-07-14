"use client";

import { Temporal } from "@js-temporal/polyfill";
import { ClockIcon } from "lucide-react";
import { useEffect, useState } from "react";

import {
  OverviewItem,
  OverviewItemContent,
  OverviewItemIcon,
} from "./overview-item";

const NANOSECONDS_PER_HOUR = 3_600_000_000_000;
const TIME_ZONE = "Europe/Zurich";

const getClock = (timeZone: string) => {
  const now = Temporal.Now.instant();
  const target = now.toZonedDateTimeISO(timeZone);
  const viewer = now.toZonedDateTimeISO(Temporal.Now.timeZoneId());
  const offsetHours =
    (target.offsetNanoseconds - viewer.offsetNanoseconds) /
    NANOSECONDS_PER_HOUR;

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

export const CurrentLocalTimeItem = () => {
  const [clock, setClock] = useState<ReturnType<typeof getClock> | null>(null);

  useEffect(() => {
    const updateClock = () => {
      setClock(getClock(TIME_ZONE));
    };

    updateClock();
    const interval = window.setInterval(updateClock, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

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
