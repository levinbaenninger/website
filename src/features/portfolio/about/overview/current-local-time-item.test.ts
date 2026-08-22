import { Temporal } from "temporal-polyfill";
import { expect, test } from "vite-plus/test";

import { getClock } from "./current-local-time-item";

const WINTER_NOON = Temporal.Instant.from("2026-01-15T12:00:00.000Z");

test("reports the viewer's matching local time", () => {
  expect(getClock("Europe/Zurich", WINTER_NOON, "Europe/Zurich")).toStrictEqual(
    {
      difference: " // same time",
      time: "01:00 PM",
    }
  );
});

test("reports whole-hour differences across daylight-saving zones", () => {
  expect(
    getClock("Europe/Zurich", WINTER_NOON, "America/New_York")
  ).toStrictEqual({
    difference: " // 6h ahead",
    time: "01:00 PM",
  });
});

test("preserves fractional UTC offsets", () => {
  expect(getClock("Asia/Kathmandu", WINTER_NOON, "UTC")).toStrictEqual({
    difference: " // 5.75h ahead",
    time: "05:45 PM",
  });
});
