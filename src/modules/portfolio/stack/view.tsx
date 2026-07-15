import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
  PanelTitleCopy,
} from "@/shared/ui/panel";

import { TECH_STACK } from "./data";
import { StackCategoryList } from "./stack-category-list";

export const StackView = () => (
  <Panel id="stack" className="mx-auto w-full md:w-3xl">
    <PanelHeader>
      <PanelTitle>
        <a href="#stack">Stack</a>
        <PanelTitleCopy id="stack" />
      </PanelTitle>
    </PanelHeader>

    <PanelContent className="p-0">
      <StackCategoryList categories={TECH_STACK} />
    </PanelContent>
  </Panel>
);
