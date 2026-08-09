import type { ReactNode } from "react";

import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
  PanelTitleCopy,
} from "@/shared/ui/panel";

export const TimelineView = ({
  children,
  id,
  title,
}: {
  children: ReactNode;
  id: string;
  title: string;
}) => (
  <Panel id={id} className="mx-auto w-full md:w-3xl">
    <PanelHeader>
      <PanelTitle>
        <a href={`#${id}`}>{title}</a>
        <PanelTitleCopy id={id} />
      </PanelTitle>
    </PanelHeader>

    <PanelContent className="px-4 py-0">{children}</PanelContent>
  </Panel>
);
