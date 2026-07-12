import {
  AwardIcon,
  BookmarkIcon,
  BoxIcon,
  BriefcaseBusinessIcon,
  GraduationCapIcon,
  InfoIcon,
} from "lucide-react";
import type { ReactElement } from "react";

export interface PortfolioNavigationItem {
  title: string;
  href: string;
  icon: ReactElement;
  shortcut?: string;
}

export const PORTFOLIO_NAVIGATION_ITEMS: PortfolioNavigationItem[] = [
  {
    title: "About",
    href: "/#about",
    icon: <InfoIcon />,
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
    href: "/achievements",
    icon: <AwardIcon />,
  },
  {
    title: "Bookmarks",
    href: "/#bookmarks",
    icon: <BookmarkIcon />,
  },
];
