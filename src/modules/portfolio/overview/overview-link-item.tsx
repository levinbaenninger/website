import type { ReactNode } from "react";

import {
  OverviewItem,
  OverviewItemContent,
  OverviewItemIcon,
  OverviewItemLink,
} from "./overview-item";

interface OverviewLinkItemProps extends React.ComponentProps<"a"> {
  icon: ReactNode;
}

export const OverviewLinkItem = ({
  children,
  icon,
  ...props
}: OverviewLinkItemProps) => (
  <OverviewItem>
    <OverviewItemIcon>{icon}</OverviewItemIcon>
    <OverviewItemContent>
      <OverviewItemLink {...props}>{children}</OverviewItemLink>
    </OverviewItemContent>
  </OverviewItem>
);
