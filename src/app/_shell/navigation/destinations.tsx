import type { UseHotkeySequenceDefinition } from "@tanstack/react-hotkeys";
import { NewspaperIcon } from "lucide-react";
import type { ReactElement } from "react";

import { BrandMark } from "@/app/_shell/branding/brand-mark";

export interface AppDestination {
  title: string;
  href: string;
  icon: ReactElement;
  shortcut?: UseHotkeySequenceDefinition["sequence"];
}

export const APP_DESTINATIONS: AppDestination[] = [
  {
    title: "Portfolio",
    href: "/",
    icon: <BrandMark />,
    shortcut: ["G", "H"],
  },
  {
    title: "Blog",
    href: "/blog",
    icon: <NewspaperIcon />,
    shortcut: ["G", "B"],
  },
];
