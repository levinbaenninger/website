import { GitHub } from "./icons/github";
import { LinkedIn } from "./icons/linkedin";
import { X } from "./icons/x";
import type { SocialProfile } from "./social-profile";

export const SOCIAL_PROFILES: SocialProfile[] = [
  {
    name: "x",
    icon: <X />,
    title: "X",
    handle: "@levinbaenninger",
    href: "https://x.com/levinbaenninger",
  },
  {
    name: "github",
    icon: <GitHub />,
    title: "GitHub",
    handle: "levinbaenninger",
    href: "https://github.com/levinbaenninger",
  },
  {
    name: "linkedin",
    icon: <LinkedIn />,
    title: "LinkedIn",
    handle: "levinbaenninger",
    href: "https://linkedin.com/in/levinbaenninger",
  },
];
