import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
  PanelTitleCopy,
} from "@/shared/ui/panel";

import { ExperienceItem } from "./experience-item";

export const ExperiencesView = () => (
  <Panel id="experience" className="mx-auto w-full md:w-3xl">
    <PanelHeader>
      <PanelTitle>
        <a href="#experience">Experience</a>
        <PanelTitleCopy id="experience" />
      </PanelTitle>
    </PanelHeader>

    <PanelContent className="px-4 py-0">
      <ExperienceItem />
    </PanelContent>
  </Panel>
);
