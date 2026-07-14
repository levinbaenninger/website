import { CodeXmlIcon } from "lucide-react";

import {
  OverviewItem,
  OverviewItemContent,
  OverviewItemIcon,
} from "./overview-item";

export const EmploymentItem = () => (
  <OverviewItem className="sm:col-span-2">
    <OverviewItemIcon>
      <CodeXmlIcon />
    </OverviewItemIcon>
    <OverviewItemContent>
      Software Engineer Apprentice <span aria-label="at">@</span> Bühler
    </OverviewItemContent>
  </OverviewItem>
);
