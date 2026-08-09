import { CodeXmlIcon, LinkIcon, MailIcon, MapPinIcon } from "lucide-react";

import {
  Panel,
  PanelContent,
  PanelTitle,
  PanelVisuallyHiddenHeader,
} from "@/shared/ui/panel";

import { CurrentLocalTimeItem } from "./current-local-time-item";
import {
  OverviewItem,
  OverviewItemContent,
  OverviewItemIcon,
  OverviewItemLink,
} from "./overview-item";

export const OverviewView = ({
  email,
  employment,
  location,
  timeZone,
  website,
}: {
  email: string;
  employment: { company: string; role: string };
  location: { href: string; label: string };
  timeZone: string;
  website: { href: string; label: string };
}) => (
  <Panel className="mx-auto w-full screen-line-bottom-none md:w-3xl">
    <PanelVisuallyHiddenHeader>
      <PanelTitle>Overview</PanelTitle>
    </PanelVisuallyHiddenHeader>
    <PanelContent className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
      <OverviewItem className="sm:col-span-2">
        <OverviewItemIcon>
          <CodeXmlIcon />
        </OverviewItemIcon>
        <OverviewItemContent>
          {employment.role} <span aria-label="at">@</span> {employment.company}
        </OverviewItemContent>
      </OverviewItem>
      <OverviewItem>
        <OverviewItemIcon>
          <MapPinIcon />
        </OverviewItemIcon>
        <OverviewItemContent>
          <OverviewItemLink href={location.href}>
            {location.label}
          </OverviewItemLink>
        </OverviewItemContent>
      </OverviewItem>
      <CurrentLocalTimeItem timeZone={timeZone} />
      <OverviewItem>
        <OverviewItemIcon>
          <LinkIcon />
        </OverviewItemIcon>
        <OverviewItemContent>
          <OverviewItemLink href={website.href}>
            {website.label}
          </OverviewItemLink>
        </OverviewItemContent>
      </OverviewItem>
      <OverviewItem>
        <OverviewItemIcon>
          <MailIcon />
        </OverviewItemIcon>
        <OverviewItemContent>
          <OverviewItemLink href={`mailto:${email}`}>{email}</OverviewItemLink>
        </OverviewItemContent>
      </OverviewItem>
    </PanelContent>
  </Panel>
);
