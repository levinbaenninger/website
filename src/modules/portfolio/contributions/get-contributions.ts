import type { Activity } from "./contribution-graph";

interface GitHubContributionsResponse {
  contributions: Activity[];
}

export const getContributions = async (username: string) => {
  const response = await fetch(
    `${process.env.GITHUB_CONTRIBUTIONS_API_URL ?? "https://github-contributions-api.jogruber.de"}/v4/${username}?y=last`
  );

  if (!response.ok) {
    return [];
  }

  // eslint-disable-next-line typescript/no-unsafe-assignment -- The API response is typed at this boundary.
  const data: Partial<GitHubContributionsResponse> = await response.json();
  return data.contributions ?? [];
};
