import type { SocialImageInput } from "@/shared/social-image";

export const BLOG_SOCIAL_IMAGE = {
  alt: "Levin Bänninger: Blog",
  author: "Levin Bänninger",
  label: "Blog",
  site: "levin.baenninger.me",
  tagline: "Notes on the web, tooling, and learning",
  title: "Levin Bänninger’s Blog",
} as const satisfies SocialImageInput;
