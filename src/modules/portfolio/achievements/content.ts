export interface Achievement {
  id: string;
  date: string;
  description: string;
  issuer: string;
  title: string;
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: "example-competition",
    date: "2026",
    description: `- Recognized for building a thoughtful solution to a challenging technical problem.
- Collaborated with a small team to take the idea from concept to working prototype.`,
    issuer: "Example competition organizer",
    title: "First place at an example software competition",
  },
  {
    id: "example-certification",
    date: "2025",
    description: `- Demonstrated practical knowledge across the certification’s core subject areas.
- Applied the material through hands-on exercises and a final assessment.`,
    issuer: "Example certification provider",
    title: "Example professional certification",
  },
  {
    id: "example-community-award",
    date: "2024",
    description: `- Acknowledged for consistently contributing time, ideas, and technical support.
- Helped make shared tools and learning resources more useful for the wider community.`,
    issuer: "Example community organization",
    title: "Example community contribution award",
  },
];
