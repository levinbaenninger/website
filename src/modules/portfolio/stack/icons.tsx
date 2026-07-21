import {
  Angular,
  ClaudeAI,
  Cloudflare,
  CodexDark,
  CodexLight,
  CSharp,
  CursorDark,
  CursorLight,
  Docker,
  DrizzleORMDark,
  DrizzleORMLight,
  EffectTSDark,
  EffectTSLight,
  Figma,
  Git,
  GitHubDark,
  GitHubLight,
  Jest,
  MicrosoftAzure,
  MicrosoftNET,
  Nextjs,
  Nodejs,
  NxDark,
  NxLight,
  Playwright,
  PostgreSQL,
  ReactDark,
  ReactLight,
  RxJS,
  ShadcnUiDark,
  ShadcnUiLight,
  TailwindCSS,
  TanStack,
  TRPC,
  TurborepoDark,
  TurborepoLight,
  TypeScript,
  VercelDark,
  VercelLight,
  Vite,
  Vitest,
} from "@ridemountainpig/svgl-react";
import type { ReactNode } from "react";

import type { StackIconName } from "./catalog";

const themedIcon = (light: ReactNode, dark: ReactNode) => (
  <>
    {light}
    {dark}
  </>
);

const NgRxIcon = () => (
  <svg viewBox="0 0 885 936" fill="none" aria-hidden>
    <defs>
      <radialGradient
        id="ngrx-gradient-a"
        cx="0"
        cy="0"
        r="1"
        gradientTransform="matrix(0 507.22601 -479.57501 0 442.9857483 427.93551636)"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#aa1bb6" />
        <stop offset="1" stopColor="#452070" />
      </radialGradient>
      <radialGradient
        id="ngrx-gradient-b"
        cx="0"
        cy="0"
        r="1"
        gradientTransform="matrix(314.00042 156.99986 -140.10327 280.20717 441.99906213 454.49818724)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset=".271" stopColor="#b1219b" />
        <stop offset="1" stopColor="#5306A1" />
      </radialGradient>
    </defs>
    <path
      fill="url(#ngrx-gradient-a)"
      d="m884.66201 156.28199-31.932 501.024-305.308-656.962 337.24 155.938zm-211.467 647.85-230.693 131.524-230.697-131.524 13.041-76.656h435.323l13.026 76.656zm-641.251-146.826-31.606-501.024 337.241-155.938-305.635 656.962z"
    />
    <path
      fill="url(#ngrx-gradient-b)"
      fillRule="evenodd"
      d="m659.088 405.822-.031.223c-13.501 78.671-65.716 128.406-156.643 149.205 22.487 15.76 48.746 20.03 79.148 12.887-56.769 21.049-106.851 21.829-150.384 2.523 7.658 27.109 25.618 46.663 54.154 58.958-70.729-15.187-117.11-64.163-139.041-146.887-11.197 14.777-10.349 39.417 2.493 74.327-38.297-46.361-45.439-95.099-21.274-146.093 25.329-56.047 71.337-78.504 138.048-67.36 90.561 99.362 148.945 128.377 174.887 86.93 11.35-35.449-.319-79.058-35.081-130.67-24.962-35.259-54.36-59.988-87.947-73.794-6.876-19.519-19.109-33.187-36.275-40.34-11.959-5.576-23.016-6.665-32.698-2.725a289.18 289.18 0 0 0-4.702 1.982c-15.414 6.6-41.02 17.563-69.535 6.735-21.099-8.012-35.908-2.875-44.427 15.409-8.392 18.749-14.014 28.93-16.866 30.543-4.339 3.381-13.568 6.907-27.607 10.527-14.038 3.621-22.843 9.208-26.415 16.76-6.589 16.007-8.976 28.923-7.161 38.75-3.162 12.193-8.249 20.425-15.249 24.508a209.757 209.757 0 0 1-4.642 2.614c-7.335 4.046-11.006 6.07-12.845 14.71l-.15.703c-2.081 9.731-2.77 12.95 7.243 45.395-6.537 48.122 1.4 94.478 23.804 138.875-.028-.054 31.324 78.254 117.58 119.073 91.362 37.777 172.706 24.386 244.032-40.173-42.258 8.519-73.359 9.106-93.16 1.885 75.314-5.495 124.594-42.218 148.117-110.123-31.32 24.184-55.572 38.283-72.593 42.079 29.159-18.58 49.105-40.006 59.984-64.115 10.88-24.108 12.625-48.549 5.236-73.321zm-114.963-99.895c-6.88 8.884-16.024 29.56 2.436 41.192 18.46 11.633 10.235-2.928 3.815-11.663-6.42-8.734-6.251-29.529-6.251-29.529z"
      clipRule="evenodd"
    />
  </svg>
);

const AlchemyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#3f5a2a"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 21.5 3.7272 7.25h16.5456Z" />
    <circle cx="12" cy="12" r="1.1" fill="#3f5a2a" stroke="none" />
  </svg>
);

export const STACK_ICONS = {
  alchemy: <AlchemyIcon />,
  angular: <Angular aria-hidden />,
  azure: <MicrosoftAzure aria-hidden />,
  claude: <ClaudeAI aria-hidden />,
  cloudflare: <Cloudflare aria-hidden />,
  codex: themedIcon(
    <CodexLight className="dark:hidden" aria-hidden />,
    <CodexDark className="hidden dark:block" aria-hidden />
  ),
  csharp: <CSharp aria-hidden />,
  cursor: themedIcon(
    <CursorLight className="dark:hidden" aria-hidden />,
    <CursorDark className="hidden dark:block" aria-hidden />
  ),
  docker: <Docker aria-hidden />,
  dotnet: <MicrosoftNET aria-hidden />,
  drizzle: themedIcon(
    <DrizzleORMLight className="dark:hidden" aria-hidden />,
    <DrizzleORMDark className="hidden dark:block" aria-hidden />
  ),
  effect: themedIcon(
    <EffectTSLight className="dark:hidden" aria-hidden />,
    <EffectTSDark className="hidden dark:block" aria-hidden />
  ),
  figma: <Figma aria-hidden />,
  git: <Git aria-hidden />,
  github: themedIcon(
    <GitHubLight className="dark:hidden" aria-hidden />,
    <GitHubDark className="hidden dark:block" aria-hidden />
  ),
  jest: <Jest aria-hidden />,
  nextjs: <Nextjs aria-hidden />,
  ngrx: <NgRxIcon />,
  nodejs: <Nodejs aria-hidden />,
  nx: themedIcon(
    <NxLight className="dark:hidden" aria-hidden />,
    <NxDark className="hidden dark:block" aria-hidden />
  ),
  playwright: <Playwright aria-hidden />,
  postgresql: <PostgreSQL aria-hidden />,
  react: themedIcon(
    <ReactLight className="dark:hidden" aria-hidden />,
    <ReactDark className="hidden dark:block" aria-hidden />
  ),
  rxjs: <RxJS aria-hidden />,
  shadcn: themedIcon(
    <ShadcnUiLight className="dark:hidden" aria-hidden />,
    <ShadcnUiDark className="hidden dark:block" aria-hidden />
  ),
  tailwind: <TailwindCSS aria-hidden />,
  tanstack: <TanStack aria-hidden />,
  trpc: <TRPC aria-hidden />,
  turborepo: themedIcon(
    <TurborepoLight className="dark:hidden" aria-hidden />,
    <TurborepoDark className="hidden dark:block" aria-hidden />
  ),
  typescript: <TypeScript aria-hidden />,
  vercel: themedIcon(
    <VercelLight className="dark:hidden" aria-hidden />,
    <VercelDark className="hidden dark:block" aria-hidden />
  ),
  vite: <Vite aria-hidden />,
  vitest: <Vitest aria-hidden />,
} satisfies Record<StackIconName, ReactNode>;
