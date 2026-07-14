import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/shared/ui/panel";

import { SOCIAL_PROFILES } from "./profiles";
import { SocialProfileItem } from "./social-profile-item";

export const SocialView = () => (
  <Panel className="mx-auto w-full md:w-3xl">
    <PanelHeader visuallyHidden>
      <PanelTitle>Social profiles</PanelTitle>
    </PanelHeader>
    <PanelContent>
      <ul className="flex flex-wrap gap-2">
        {SOCIAL_PROFILES.map((profile) => (
          <SocialProfileItem key={profile.name} profile={profile} />
        ))}
      </ul>
    </PanelContent>
  </Panel>
);
