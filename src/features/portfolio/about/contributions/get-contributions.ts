import { z } from "zod";

import type { Activity } from "./contribution-graph";

export type ContributionsResult =
  | { status: "success"; contributions: Activity[] }
  | { status: "unavailable" };

const activitySchema = z.object({
  count: z.number().int().min(0),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u)
    .refine((date) => {
      // The pattern admits impossible dates like 2026-02-31; round-tripping
      // through UTC proves the calendar day exists.
      const parsed = new Date(`${date}T00:00:00.000Z`);
      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === date
      );
    }),
  level: z.number().int().min(0).max(4),
});

const contributionsResponseSchema = z.object({
  contributions: z.array(activitySchema),
});

export const getContributions = async (
  username: string
): Promise<ContributionsResult> => {
  try {
    const response = await fetch(
      `${process.env.GITHUB_CONTRIBUTIONS_API_URL ?? "https://github-contributions-api.jogruber.de"}/v4/${username}?y=last`
    );

    if (!response.ok) {
      return { status: "unavailable" };
    }

    const data: unknown = await response.json();
    const parsed = contributionsResponseSchema.safeParse(data);
    return parsed.success
      ? { status: "success", contributions: parsed.data.contributions }
      : { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
};
