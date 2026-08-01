// PROTOTYPE — throwaway. Delete this directory once issue #34 is decided.
//
// The production registry, with five entries replaced. Everything else — every
// Callout, Card, Files, Steps, CodeTabs, Figure, Kbd, link, list, quote, table
// cell and task input on screen — is the real component from
// `rendering/components.tsx` and `rendering/interactions.tsx`, styled entirely
// from `language.css`.
//
// `Accordion` and `Tabs` are bridged rather than replaced: the panels are still
// the production ones (see `panels.tsx` and NOTES finding 1). `h2`–`h6`, `pre`
// and `table` are the three places where the presentation language needs markup
// the production components do not emit; each is a finding for #37.

import type { MDXComponents } from "mdx/types";

import { getArticleMdxComponents } from "@/modules/blog/rendering/mdx-components";

import { PrototypeCodeBlock } from "./code-block";
import { createPrototypeHeading } from "./heading";
import { PrototypeAccordion, PrototypeTabs } from "./panels";
import type { HeadingAnchor } from "./params";
import { PrototypeTable } from "./table";

export const createPrototypeMdxComponents = (
  anchor: HeadingAnchor
): MDXComponents => ({
  ...getArticleMdxComponents(),
  Accordion: PrototypeAccordion,
  Tabs: PrototypeTabs,
  h2: createPrototypeHeading("h2", anchor),
  h3: createPrototypeHeading("h3", anchor),
  h4: createPrototypeHeading("h4", anchor),
  h5: createPrototypeHeading("h5", anchor),
  h6: createPrototypeHeading("h6", anchor),
  pre: PrototypeCodeBlock,
  table: PrototypeTable,
});
