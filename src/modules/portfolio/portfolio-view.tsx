import { Biography } from "./about/biography";
import { ABOUT_CONTENT } from "./about/content";
import { IntroductionView } from "./about/introduction/view";
import { OverviewView } from "./about/overview/view";
import { GITHUB_PROFILE } from "./about/social/profiles";
import { SocialView } from "./about/social/view";
import { PORTFOLIO_NAME } from "./content";
import { ContributionsView } from "./contributions/view";
import { SectionSeparator } from "./section-separator";
import { StackView } from "./stack/view";

export const PortfolioView = () => (
  <>
    <IntroductionView
      avatar={ABOUT_CONTENT.introduction.avatar}
      descriptions={ABOUT_CONTENT.introduction.descriptions}
      name={PORTFOLIO_NAME}
    />
    <SectionSeparator />
    <OverviewView
      {...ABOUT_CONTENT.overview}
      employment={ABOUT_CONTENT.employment}
    />
    <SocialView />
    <ContributionsView
      githubProfileUrl={GITHUB_PROFILE.href}
      username={GITHUB_PROFILE.handle}
    />

    <SectionSeparator />

    <Biography
      {...ABOUT_CONTENT.biography}
      {...ABOUT_CONTENT.employment}
      name={PORTFOLIO_NAME}
    />

    <SectionSeparator />

    <StackView />

    <SectionSeparator />
  </>
);
