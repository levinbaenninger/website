import {
  AwardIcon,
  BookmarkIcon,
  BoxIcon,
  BriefcaseBusinessIcon,
  GraduationCapIcon,
  InfoIcon,
  Layers3Icon,
} from "lucide-react";
import type { ReactElement } from "react";

export interface PortfolioDestination {
  title: string;
  href: string;
  icon: ReactElement;
}

export const PORTFOLIO_DESTINATIONS: PortfolioDestination[] = [
  {
    title: "About",
    href: "/#about",
    icon: <InfoIcon />,
  },
  {
    title: "Stack",
    href: "/#stack",
    icon: <Layers3Icon />,
  },
  {
    title: "Experience",
    href: "/#experience",
    icon: <BriefcaseBusinessIcon />,
  },
  {
    title: "Education",
    href: "/#education",
    icon: <GraduationCapIcon />,
  },
  {
    title: "Projects",
    href: "/#projects",
    icon: <BoxIcon />,
  },
  {
    title: "Achievements",
    href: "/#achievements",
    icon: <AwardIcon />,
  },
  {
    title: "Bookmarks",
    href: "/#bookmarks",
    icon: <BookmarkIcon />,
  },
];
