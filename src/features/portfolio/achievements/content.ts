export interface Achievement {
  id: string;
  date: string;
  description: string;
  issuer: string;
  resource?: {
    href: string;
    label: string;
  };
  tags: readonly string[];
  title: string;
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: "swissskills-2025",
    date: "2025",
    description: `Qualified as one of 25 competitors for the national Web Technologies championship at SwissSkills 2025 in Bern.

* Developed a Wordle-style game with custom word lengths, attempt limits, and imported word sets.
* Transformed raw wind-turbine logs into structured data served through an authenticated API.
* Completed both full-stack challenges under strict competition conditions.`,
    issuer: "SwissSkills",
    resource: {
      href: "https://swiss-skills2025.ch/de/mitglied/ssk/39503/16891/levin-banninger?events=16891",
      label: "View SwissSkills profile",
    },
    tags: ["Competition", "Web Technologies", "Full-Stack"],
    title: "SwissSkills 2025 – National Web Technologies Competitor",
  },
  {
    id: "regional-ict-championships-2025",
    date: "2025",
    description: `Won 1st place in Eastern Switzerland and ranked 4th nationally, securing qualification for SwissSkills 2025.

* Built an interactive 3D spaceflight simulator that allowed users to select missions, control a spacecraft, and adjust its trajectory in real time.
* Delivered the full-stack solution under competition time constraints using HTML, CSS, JavaScript, and Express.js.`,
    issuer: "ICT-Berufsbildung Schweiz",
    resource: {
      href: "https://www.ict-berufsbildung.ch/resources/RM_Year2025_Ranking-ALL_ICT-BBCH5.pdf#page=5",
      label: "View official ranking",
    },
    tags: ["Competition", "Web Technologies", "Full-Stack", "3D Simulation"],
    title: "Regional ICT Championships 2025 – 1st Regionally, 4th Nationally",
  },
];
