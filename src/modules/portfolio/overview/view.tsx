import { CurrentLocalTimeItem } from "./current-local-time-item";
import { EmailItem } from "./email-item";
import { EmploymentItem } from "./employment-item";
import { LocationItem } from "./location-item";
import { WebsiteItem } from "./website-item";

export const OverviewView = () => (
  <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
    <EmploymentItem />
    <LocationItem />
    <CurrentLocalTimeItem />
    <WebsiteItem />
    <EmailItem />
  </div>
);
