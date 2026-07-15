import { ContributionsView } from "./contributions/view";
import { HelloView } from "./hello/view";
import { IntroductionView } from "./introduction";
import { OverviewView } from "./overview/view";
import { SectionSeparator } from "./section-separator";
import { SocialView } from "./social/view";
import { StackView } from "./stack/view";

export const PortfolioView = () => (
  <>
    <IntroductionView />
    <SectionSeparator />
    <OverviewView />
    <SocialView />
    <ContributionsView />

    <SectionSeparator />

    <HelloView />

    <SectionSeparator />

    <StackView />

    <SectionSeparator />
  </>
);
