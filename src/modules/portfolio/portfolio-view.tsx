import { IntroductionView } from "./introduction";
import { OverviewView } from "./overview/view";
import { SectionSeparator } from "./section-separator";

export const PortfolioView = () => (
  <>
    <IntroductionView />
    <SectionSeparator />
    <OverviewView />
  </>
);
