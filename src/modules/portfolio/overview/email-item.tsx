import { MailIcon } from "lucide-react";

import {
  OverviewItem,
  OverviewItemContent,
  OverviewItemIcon,
  OverviewItemLink,
} from "./overview-item";

export const EmailItem = () => (
  <OverviewItem>
    <OverviewItemIcon>
      <MailIcon />
    </OverviewItemIcon>
    <OverviewItemContent>
      <OverviewItemLink href="mailto:levin@baenninger.me">
        levin@baenninger.me
      </OverviewItemLink>
    </OverviewItemContent>
  </OverviewItem>
);
