import type { SocialImageInput } from "@/shared/social-image";

import { PORTFOLIO_NAME } from "./content";

export const PORTFOLIO_SOCIAL_IMAGE = {
  alt: `${PORTFOLIO_NAME}: Portfolio`,
  label: "Portfolio",
  title: PORTFOLIO_NAME,
} as const satisfies SocialImageInput;
