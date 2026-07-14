import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/shared/ui/panel";

import { CurrentLocalTimeItem } from "./current-local-time-item";
import { EmailItem } from "./email-item";
import { EmploymentItem } from "./employment-item";
import { LocationItem } from "./location-item";
import { WebsiteItem } from "./website-item";

export const OverviewView = () => (
  <Panel className="mx-auto w-full md:w-3xl">
    <PanelHeader visuallyHidden>
      <PanelTitle>Overview</PanelTitle>
    </PanelHeader>
    <PanelContent className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
      <EmploymentItem />
      <LocationItem />
      <CurrentLocalTimeItem />
      <WebsiteItem />
      <EmailItem />
    </PanelContent>
  </Panel>
);
