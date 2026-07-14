import { LinkIcon } from "lucide-react";

import {
  OverviewItem,
  OverviewItemContent,
  OverviewItemIcon,
  OverviewItemLink,
} from "./overview-item";

export const WebsiteItem = () => (
  <OverviewItem>
    <OverviewItemIcon>
      <LinkIcon />
    </OverviewItemIcon>
    <OverviewItemContent>
      <OverviewItemLink href="https://levin.baenninger.me">
        levin.baenninger.me
      </OverviewItemLink>
    </OverviewItemContent>
  </OverviewItem>
);
