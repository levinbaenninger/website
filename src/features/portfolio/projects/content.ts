export interface Project {
  id: string;
  description: string;
  endDate: string | null;
  kind: string;
  links?: {
    githubRepository?: string;
    liveSite?: string;
  };
  skills: readonly string[];
  startDate: string;
  status: string;
  title: string;
}

export const PROJECTS = [
  {
    id: "meetique",
    description: `Meetique is a project designed to help users meet with an agent, receive a clear summary, and stay focused during their interactions. The main goal is to streamline agent meetings and provide concise summaries for better productivity.`,
    endDate: "2026",
    kind: "Personal project",
    links: {
      liveSite: "https://meetique.baenninger.me",
      githubRepository: "https://github.com/levinbaenninger/meetique",
    },
    skills: ["Next.js", "AI", "tRPC", "PostgreSQL"],
    startDate: "2025",
    status: "Finished",
    title: "Meetique",
  },
] as const satisfies readonly Project[];
