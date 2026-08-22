import { CodeXmlIcon, LinkIcon, MailIcon, MapPinIcon } from "lucide-react";

import { CopyButton } from "@/shared/ui/copy-button";
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
      <OverviewItem className="group/overview-email">
        <OverviewItemIcon>
          <MailIcon />
        </OverviewItemIcon>
        <OverviewItemContent className="inline-flex items-center">
          <OverviewItemLink href={`mailto:${email}`}>{email}</OverviewItemLink>
          <CopyButton
            className="ml-1 size-7 shrink-0 border-none align-middle text-muted-foreground opacity-100 transition-opacity motion-reduce:transition-none sm:opacity-0 sm:group-focus-within/overview-email:opacity-100 sm:group-hover/overview-email:opacity-100 sm:focus-visible:opacity-100"
            variant="ghost"
            text={email}
            aria-label="Copy email"
          />
        </OverviewItemContent>
      </OverviewItem>
    </PanelContent>
  </Panel>
);
