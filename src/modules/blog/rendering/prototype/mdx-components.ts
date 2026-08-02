// PROTOTYPE — throwaway. Delete this directory once issue #34 is decided.
//
// The production registry, with three entries replaced. Everything else — every
// Callout, Card, Files, Steps, Accordion, Tabs, CodeTabs, Figure, Kbd, link,
// list, quote, table cell and task input on screen — is the real component from
// `rendering/components.tsx` and `rendering/interactions.tsx`, styled entirely
// from `language.css`.
//
// `h2`–`h6`, `pre` and `table` are the three places where the presentation
// language needs markup the production components do not emit; each is a finding
// for #37.

import type { MDXComponents } from "mdx/types";

import { getArticleMdxComponents } from "@/modules/blog/rendering/mdx-components";

import { PrototypeCodeBlock } from "./code-block";
import { createPrototypeHeading } from "./heading";
import type { HeadingAnchor } from "./params";
import { PrototypeTable } from "./table";

export const createPrototypeMdxComponents = (
  anchor: HeadingAnchor
): MDXComponents => ({
  ...getArticleMdxComponents(),
  // h5 and h6 are deliberately not overridden: the language now stops at h4.
  // See NOTES, Revision 2.
  h2: createPrototypeHeading("h2", anchor),
  h3: createPrototypeHeading("h3", anchor),
  h4: createPrototypeHeading("h4", anchor),
  pre: PrototypeCodeBlock,
  table: PrototypeTable,
});
