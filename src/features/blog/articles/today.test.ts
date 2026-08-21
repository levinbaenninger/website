import { Temporal } from "temporal-polyfill";
import { expect, test, vi } from "vite-plus/test";

import { getZurichToday } from "./today";

test("derives the production calendar date in Europe/Zurich", () => {
  const today = Temporal.PlainDate.from("2026-07-28");
  const plainDateISO = vi.fn(() => today);

  expect(getZurichToday(plainDateISO)).toBe(today);
  expect(plainDateISO).toHaveBeenCalledWith("Europe/Zurich");
});
