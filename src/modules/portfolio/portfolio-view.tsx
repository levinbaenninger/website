import { AboutView } from "./about/view";
import { AchievementsView } from "./achievements/view";
import { BookmarksView } from "./bookmarks/view";
import { EducationView } from "./education/view";
import { ExperiencesView } from "./experiences/view";
import { ProjectsView } from "./projects/view";
import { SectionSeparator } from "./section-separator";
import { StackView } from "./stack/view";

export const PortfolioView = () => (
  <>
    <AboutView />
    <SectionSeparator />
    <StackView />
    <SectionSeparator />
    <ExperiencesView />
    <SectionSeparator />
    <EducationView />
    <SectionSeparator />
    <ProjectsView />
    <SectionSeparator />
    <AchievementsView />
    <SectionSeparator />
    <BookmarksView />
  </>
);
