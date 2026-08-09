import { Suspense } from "react";

import {
  Panel,
  PanelContent,
  PanelTitle,
  PanelVisuallyHiddenHeader,
} from "@/shared/ui/panel";

import { getContributions } from "./get-contributions";
import {
  GitHubContributions,
  GitHubContributionsFallback,
} from "./github-contributions";

export const ContributionsView = ({
  githubProfileUrl,
  username,
}: {
  githubProfileUrl: string;
  username: string;
}) => {
  const contributions = getContributions(username);

  return (
    <Panel className="mx-auto w-full md:w-3xl">
      <PanelVisuallyHiddenHeader>
        <PanelTitle>Contributions</PanelTitle>
      </PanelVisuallyHiddenHeader>
      <PanelContent>
        <Suspense fallback={<GitHubContributionsFallback />}>
          <GitHubContributions
            contributions={contributions}
            githubProfileUrl={githubProfileUrl}
          />
        </Suspense>
      </PanelContent>
    </Panel>
  );
};
