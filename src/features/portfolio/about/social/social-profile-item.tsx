import { Button } from "@/shared/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import type { SocialProfile } from "./profiles";

export const SocialProfileItem = ({ profile }: { profile: SocialProfile }) => (
  <li>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" asChild>
          <a href={profile.href} target="_blank" rel="noopener">
            {profile.icon}
            <span className="sr-only">{profile.title}</span>
          </a>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {profile.title} ({profile.handle})
      </TooltipContent>
    </Tooltip>
  </li>
);
