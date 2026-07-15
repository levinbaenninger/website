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
        description:
          "I help maintain our **component library** so teams can ship faster without compromising the user experience.",
        employmentType: "Full-time",
        endDate: null as string | null,
        skills: ["Skill one", "Skill two", "Skill three"],
        startDate: "08.2023",
        title: "Software Engineer Apprentice",
      },
    ],
  },
] as const;

export type Experience = (typeof EXPERIENCES)[number];
export type ExperiencePosition = Experience["positions"][number];
