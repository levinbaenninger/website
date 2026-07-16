import { GitHubIcon } from "@/modules/portfolio/icons/github-icon";

import { LinkedIn } from "./icons/linkedin";
import { X } from "./icons/x";

export interface SocialProfile {
  name: string;
  title: string;
  icon: React.ReactElement;
  handle: string;
  href: string;
}

export const GITHUB_PROFILE = {
  name: "github",
  icon: <GitHubIcon />,
  title: "GitHub",
  handle: "levinbaenninger",
  href: "https://github.com/levinbaenninger",
} satisfies SocialProfile;

export const SOCIAL_PROFILES = [
  GITHUB_PROFILE,
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
] satisfies SocialProfile[];
