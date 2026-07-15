export interface StackCatalogItem {
  href: string;
  icon: string;
  title: string;
}

export interface StackCatalogCategory {
  category: string;
  items: readonly StackCatalogItem[];
}

export const STACK_CATALOG = [
  {
    category: "Language",
    items: [
      {
        href: "https://www.typescriptlang.org",
        icon: "typescript",
        title: "TypeScript",
      },
      {
        href: "https://dotnet.microsoft.com/languages/csharp",
        icon: "csharp",
        title: "C#",
      },
    ],
  },
  {
    category: "Frontend",
    items: [
      { href: "https://react.dev", icon: "react", title: "React" },
      { href: "https://angular.dev", icon: "angular", title: "Angular" },
      { href: "https://nextjs.org", icon: "nextjs", title: "Next.js" },
      { href: "https://tanstack.com", icon: "tanstack", title: "TanStack" },
      { href: "https://ngrx.io", icon: "ngrx", title: "NgRx" },
      { href: "https://rxjs.dev", icon: "rxjs", title: "RxJS" },
      {
        href: "https://tailwindcss.com",
        icon: "tailwind",
        title: "Tailwind CSS",
      },
      { href: "https://ui.shadcn.com", icon: "shadcn", title: "shadcn/ui" },
    ],
  },
  {
    category: "Backend",
    items: [
      { href: "https://nodejs.org", icon: "nodejs", title: "Node.js" },
      { href: "https://effect.website", icon: "effect", title: "Effect" },
      { href: "https://dotnet.microsoft.com", icon: "dotnet", title: ".NET" },
      { href: "https://trpc.io", icon: "trpc", title: "tRPC" },
    ],
  },
  {
    category: "Database",
    items: [
      {
        href: "https://www.postgresql.org",
        icon: "postgresql",
        title: "PostgreSQL",
      },
      {
        href: "https://orm.drizzle.team",
        icon: "drizzle",
        title: "Drizzle ORM",
      },
    ],
  },
  {
    category: "Workflow",
    items: [
      { href: "https://git-scm.com", icon: "git", title: "Git" },
      { href: "https://github.com", icon: "github", title: "GitHub" },
      { href: "https://nx.dev", icon: "nx", title: "Nx" },
      { href: "https://turborepo.dev", icon: "turborepo", title: "Turborepo" },
      { href: "https://www.docker.com", icon: "docker", title: "Docker" },
      { href: "https://alchemy.run", icon: "alchemy", title: "Alchemy" },
      { href: "https://vite.dev", icon: "vite", title: "Vite" },
    ],
  },
  {
    category: "Testing",
    items: [
      { href: "https://jestjs.io", icon: "jest", title: "Jest" },
      { href: "https://vitest.dev", icon: "vitest", title: "Vitest" },
      {
        href: "https://playwright.dev",
        icon: "playwright",
        title: "Playwright",
      },
    ],
  },
  {
    category: "Cloud",
    items: [
      { href: "https://vercel.com", icon: "vercel", title: "Vercel" },
      { href: "https://azure.microsoft.com", icon: "azure", title: "Azure" },
      {
        href: "https://www.cloudflare.com",
        icon: "cloudflare",
        title: "Cloudflare",
      },
    ],
  },
  {
    category: "AI",
    items: [
      { href: "https://claude.ai", icon: "claude", title: "Claude" },
      { href: "https://openai.com/codex", icon: "codex", title: "Codex" },
      { href: "https://cursor.com", icon: "cursor", title: "Cursor" },
    ],
  },
  {
    category: "Design",
    items: [{ href: "https://www.figma.com", icon: "figma", title: "Figma" }],
  },
] as const satisfies readonly StackCatalogCategory[];

export type StackIconName =
  (typeof STACK_CATALOG)[number]["items"][number]["icon"];
