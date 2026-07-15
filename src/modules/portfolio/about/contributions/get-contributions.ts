import type { Activity } from "./contribution-graph";

interface GitHubContributionsResponse {
  contributions: Activity[];
}

export type ContributionsResult =
  | { status: "success"; contributions: Activity[] }
  | { status: "unavailable" };

const isActivity = (value: unknown): value is Activity => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("date" in value) || !("count" in value) || !("level" in value)) {
    return false;
  }

  const parsedDate =
    typeof value.date === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(value.date)
      ? new Date(`${value.date}T00:00:00.000Z`)
      : null;
  const hasValidDate =
    parsedDate !== null &&
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === value.date;

  return (
    hasValidDate &&
    typeof value.count === "number" &&
    Number.isInteger(value.count) &&
    value.count >= 0 &&
    typeof value.level === "number" &&
    Number.isInteger(value.level) &&
    value.level >= 0 &&
    value.level <= 4
  );
};

const isGitHubContributionsResponse = (
  value: unknown
): value is GitHubContributionsResponse => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("contributions" in value)) {
    return false;
  }

  const { contributions } = value;
  return Array.isArray(contributions) && contributions.every(isActivity);
};

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
    return isGitHubContributionsResponse(data)
      ? { status: "success", contributions: data.contributions }
      : { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
};
