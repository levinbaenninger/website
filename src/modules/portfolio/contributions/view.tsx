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

export const ContributionsView = () => {
  const contributions = getContributions("levinbaenninger");

  return (
    <Panel className="mx-auto w-full md:w-3xl">
      <PanelVisuallyHiddenHeader>
        <PanelTitle>Contributions</PanelTitle>
      </PanelVisuallyHiddenHeader>
      <PanelContent>
        <Suspense fallback={<GitHubContributionsFallback />}>
          <GitHubContributions
            contributions={contributions}
            githubProfileUrl="https://github.com/levinbaenninger"
          />
        </Suspense>
      </PanelContent>
    </Panel>
  );
};
