import { CodeXmlIcon, LinkIcon, MailIcon, MapPinIcon } from "lucide-react";

import { CurrentLocalTimeItem } from "./current-local-time-item";
import {
  OverviewItem,
  OverviewItemContent,
  OverviewItemIcon,
  OverviewItemLink,
} from "./overview-item";

export const OverviewView = () => (
  <section className="screen-line-top screen-line-bottom mx-auto grid w-full grid-cols-2 border-x md:w-3xl gap-x-4 gap-y-3 p-4">
    <OverviewItem className="sm:col-span-2">
      <OverviewItemIcon>
        <CodeXmlIcon />
      </OverviewItemIcon>
      <OverviewItemContent>
        Software Engineer Apprentice <span aria-label="at">@</span> Bühler
      </OverviewItemContent>
    </OverviewItem>

    <OverviewItem>
      <OverviewItemIcon>
        <MapPinIcon />
      </OverviewItemIcon>
      <OverviewItemContent>
        <OverviewItemLink href="https://maps.app.goo.gl/XruCEPhmEibs6vqm8">
          Switzerland
        </OverviewItemLink>
      </OverviewItemContent>
    </OverviewItem>

    <CurrentLocalTimeItem timeZone="Europe/Zurich" />

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
  </section>
);
