import { GitHub } from "./icons/github";
import { LinkedIn } from "./icons/linkedin";
import { X } from "./icons/x";

export interface SocialProfile {
  name: string;
  title: string;
  icon: React.ReactElement;
  handle: string;
  href: string;
}

export const SOCIAL_PROFILES: SocialProfile[] = [
  {
    name: "github",
    icon: <GitHub />,
    title: "GitHub",
    handle: "levinbaenninger",
    href: "https://github.com/levinbaenninger",
  },
  {
    name: "x",
    icon: <X />,
    title: "X",
    handle: "@levinbaenninger",
    href: "https://x.com/levinbaenninger",
  },
  {
    name: "linkedin",
    icon: <LinkedIn />,
    title: "LinkedIn",
    handle: "levinbaenninger",
    href: "https://linkedin.com/in/levinbaenninger",
  },
];
