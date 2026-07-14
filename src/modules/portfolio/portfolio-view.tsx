import { IntroductionView } from "./introduction";
import { OverviewView } from "./overview/view";
import { PortfolioSection } from "./portfolio-section";
import { SectionSeparator } from "./section-separator";
import { SocialView } from "./social/view";

export const PortfolioView = () => (
  <>
    <IntroductionView />
    <SectionSeparator />
    <PortfolioSection>
      <OverviewView />
    </PortfolioSection>
    <SectionSeparator />
    <PortfolioSection>
      <SocialView />
    </PortfolioSection>
  </>
);
