import type { SocialImageInput } from "@/shared/social-image";

import { ABOUT_CONTENT } from "./about/content";
import { PORTFOLIO_NAME } from "./content";

export const PORTFOLIO_SOCIAL_IMAGE = {
  alt: `${PORTFOLIO_NAME}: Portfolio`,
  author: PORTFOLIO_NAME,
  label: "Portfolio",
  site: ABOUT_CONTENT.overview.website.label,
  tagline: `${ABOUT_CONTENT.employment.role} at ${ABOUT_CONTENT.employment.company}`,
  title: PORTFOLIO_NAME,
} as const satisfies SocialImageInput;
