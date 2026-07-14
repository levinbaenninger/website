import { MapPinIcon } from "lucide-react";

import {
  OverviewItem,
  OverviewItemContent,
  OverviewItemIcon,
  OverviewItemLink,
} from "./overview-item";

export const LocationItem = () => (
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
);
