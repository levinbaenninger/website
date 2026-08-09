import { BuhlerLogo } from "./logos/buhler-logo";

export const EXPERIENCES = [
  {
    id: "buhler",
    company: {
      href: "https://www.buhlergroup.com",
      logo: BuhlerLogo,
      name: "Bühler",
    },
    location: "Uzwil, Switzerland",
    locationType: "Hybrid",
    positions: [
      {
        id: "software-engineer-apprentice",
        description: `- Built solid computer science foundations: web engineering, algorithms, databases, and the “why” behind the “what”.
- Engineered custom Azure Container Jobs to optimize Azure DevOps pipelines – reduced build times, increased scalability, and lowered infrastructure overhead, accelerating delivery cycles.
- Developed our internal component library used across products – consistent UI, reusable components, faster shipping.`,
        employmentType: "Full-time",
        endDate: null as string | null,
        skills: ["Angular", "TypeScript", "Azure", "DevOps"],
        startDate: "08.2023",
        title: "Software Engineer Apprentice",
      },
    ],
  },
] as const;

export type Experience = (typeof EXPERIENCES)[number];
export type ExperiencePosition = Experience["positions"][number];
