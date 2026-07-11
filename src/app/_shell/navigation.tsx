import { NewspaperIcon } from "lucide-react";
import type { ReactElement } from "react";

import { BrandMark } from "./brand-mark";

export interface PrimaryNavigationItem {
  title: string;
  href: string;
  icon: ReactElement;
  shortcut?: string;
}

export const PRIMARY_NAVIGATION_ITEMS: PrimaryNavigationItem[] = [
  {
    title: "Portfolio",
    href: "/",
    icon: <BrandMark />,
    shortcut: "GH",
  },
  {
    title: "Blog",
    href: "/blog",
    icon: <NewspaperIcon />,
    shortcut: "GB",
  },
];
