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
    id: "developer-portfolio",
    description: `- A personal corner of the web for sharing work, experience, and the ideas behind each project.
- Built with a focus on thoughtful interactions, accessibility, and a fast reading experience.`,
    endDate: null as string | null,
    kind: "Personal project",
    links: {
      liveSite: "https://levin.baenninger.me",
      githubRepository: "https://github.com/levinbaenninger/website",
    },
    skills: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
    startDate: "2026",
    status: "In progress",
    title: "Developer Portfolio",
  },
  {
    id: "component-playground",
    description: `- A sandbox for exploring reusable interface patterns and documenting the decisions behind them.
- Experiments with component composition, motion, theming, and accessible interaction states.`,
    endDate: "2025",
    kind: "Open-source project",
    skills: ["React", "TypeScript", "Storybook", "Accessibility"],
    startDate: "2025",
    status: "Completed",
    title: "Component Playground",
  },
  {
    id: "automation-toolkit",
    description: `- A collection of small tools that remove repetitive steps from development workflows.
- Connects local scripts and CI jobs through clear, composable commands.`,
    endDate: "2025",
    kind: "Developer tooling",
    skills: ["Node.js", "CI/CD", "Docker", "Automation"],
    startDate: "2024",
    status: "Completed",
    title: "Automation Toolkit",
  },
] as const satisfies readonly Project[];
