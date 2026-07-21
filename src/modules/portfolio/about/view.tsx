import { PORTFOLIO_NAME } from "@/modules/portfolio/content";
import { SectionSeparator } from "@/modules/portfolio/section-separator";

import { Biography } from "./biography";
import { ABOUT_CONTENT } from "./content";
import { ContributionsView } from "./contributions/view";
import { IntroductionView } from "./introduction/view";
import { OverviewView } from "./overview/view";
import { GITHUB_PROFILE } from "./social/profiles";
import { SocialView } from "./social/view";

export const AboutView = () => (
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
  </>
);
