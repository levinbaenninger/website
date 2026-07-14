import {
  Panel,
  PanelContent,
  PanelTitle,
  PanelVisuallyHiddenHeader,
} from "@/shared/ui/panel";

import { CurrentLocalTimeItem } from "./current-local-time-item";
import { EmailItem } from "./email-item";
import { EmploymentItem } from "./employment-item";
import { LocationItem } from "./location-item";
import { WebsiteItem } from "./website-item";

export const OverviewView = () => (
  <Panel className="mx-auto w-full screen-line-bottom-none md:w-3xl">
    <PanelVisuallyHiddenHeader>
      <PanelTitle>Overview</PanelTitle>
    </PanelVisuallyHiddenHeader>
    <PanelContent className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
      <EmploymentItem />
      <LocationItem />
      <CurrentLocalTimeItem />
      <WebsiteItem />
      <EmailItem />
    </PanelContent>
  </Panel>
);
