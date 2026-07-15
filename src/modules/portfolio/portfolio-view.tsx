import { AboutView } from "./about/view";
import { EducationView } from "./education/view";
import { ExperiencesView } from "./experiences/view";
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
  </>
);
