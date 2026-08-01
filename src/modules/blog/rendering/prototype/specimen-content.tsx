// PROTOTYPE — throwaway. Delete this directory once issue #34 is decided.
//
// The Article body, rendered client-side. See NOTES finding 1.
//
// The first cut rendered the specimen on the server, which is the production
// path — and that path is broken: `ArticleAccordion` and `ArticleTabs` select
// their children by reference identity, and across the RSC boundary a child
// element is not a plain element at all. `isValidElement` is false for it during
// SSR and true after hydration, so even a bridge that re-creates the children
// renders an empty tab strip on the server and a full one on the client, which
// is a hydration mismatch on top of the original defect.
//
// The defect is already proven on the real route (NOTES finding 1), so the
// prototype does not need to keep reproducing it — it needs the panels to work
// so the presentation can be judged. Rendering the body inside one client module
// graph does that, and costs nothing visually: Shiki, Twoslash and the contract
// all run at compile time, so the markup is identical either way.

"use client";

import dynamic from "next/dynamic";

import { createPrototypeMdxComponents } from "./mdx-components";
import type { HeadingAnchor, Specimen } from "./params";

// Dynamic, not static: `src/modules/blog/index.ts` re-exports this module and
// Vitest resolves that entrypoint's whole static graph without an MDX transform.
const SPECIMENS = {
  full: dynamic(async () => await import("./specimen.mdx")),
  stress: dynamic(async () => await import("./stress.mdx")),
};

export const SpecimenContent = ({
  anchor,
  specimen,
}: {
  readonly anchor: HeadingAnchor;
  readonly specimen: Specimen;
}) => {
  const Content = SPECIMENS[specimen];

  return <Content components={createPrototypeMdxComponents(anchor)} />;
};
