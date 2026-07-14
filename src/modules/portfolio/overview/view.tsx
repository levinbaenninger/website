import { CodeXmlIcon, LinkIcon, MailIcon, MapPinIcon } from "lucide-react";

import { CurrentLocalTimeItem } from "./current-local-time-item";
import {
  OverviewItem,
  OverviewItemContent,
  OverviewItemIcon,
} from "./overview-item";
import { OverviewLinkItem } from "./overview-link-item";

export const OverviewView = () => (
  <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
    <OverviewItem className="sm:col-span-2">
      <OverviewItemIcon>
        <CodeXmlIcon />
      </OverviewItemIcon>
      <OverviewItemContent>
        Software Engineer Apprentice <span aria-label="at">@</span> Bühler
      </OverviewItemContent>
    </OverviewItem>

    <OverviewLinkItem
      href="https://maps.app.goo.gl/XruCEPhmEibs6vqm8"
      icon={<MapPinIcon />}
    >
      Switzerland
    </OverviewLinkItem>

    <CurrentLocalTimeItem timeZone="Europe/Zurich" />

    <OverviewLinkItem href="https://levin.baenninger.me" icon={<LinkIcon />}>
      levin.baenninger.me
    </OverviewLinkItem>

    <OverviewLinkItem href="mailto:levin@baenninger.me" icon={<MailIcon />}>
      levin@baenninger.me
    </OverviewLinkItem>
  </div>
);
