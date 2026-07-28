import { Temporal } from "@js-temporal/polyfill";

type PlainDateNow = (
  timeZoneLike?: Temporal.TimeZoneLike
) => Temporal.PlainDate;

export const getZurichToday = (
  plainDateISO: PlainDateNow = Temporal.Now.plainDateISO
): Temporal.PlainDate => plainDateISO("Europe/Zurich");
