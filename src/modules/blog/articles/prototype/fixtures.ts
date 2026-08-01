// PROTOTYPE — throwaway. Delete this directory once issue #33 is decided.
//
// Article bodies with the four heading shapes the reader has to survive, plus
// the neighbour Articles the toolbar needs. Heading ids come from the same
// `github-slugger` pass the real remark contract uses, so the prototype's table
// of contents exercises the real deterministic heading projection.

import GithubSlugger from "github-slugger";

import type { ArticleHeadingFact } from "@/modules/blog/articles/facts";

import type { ContentShape, Neighbourhood } from "./params";

export type HeadingDepth = 2 | 3 | 4;

export type AuthoredBlock =
  | {
      readonly kind: "accordion";
      readonly items: readonly AuthoredPanel[];
    }
  | {
      readonly kind: "heading";
      readonly depth: HeadingDepth;
      readonly text: string;
    }
  | { readonly kind: "paragraph"; readonly text: string }
  | { readonly kind: "tabs"; readonly tabs: readonly AuthoredPanel[] };

interface AuthoredPanel {
  readonly blocks: readonly AuthoredBlock[];
  readonly title: string;
}

export type ResolvedBlock =
  | {
      readonly kind: "accordion";
      readonly items: readonly ResolvedPanel[];
    }
  | {
      readonly kind: "heading";
      readonly depth: HeadingDepth;
      readonly id: string;
      readonly text: string;
    }
  | { readonly kind: "paragraph"; readonly text: string }
  | { readonly kind: "tabs"; readonly tabs: readonly ResolvedPanel[] };

export interface ResolvedPanel {
  readonly blocks: readonly ResolvedBlock[];
  readonly title: string;
}

export interface ResolvedBody {
  readonly blocks: readonly ResolvedBlock[];
  readonly headings: readonly ArticleHeadingFact[];
}

const paragraph = (text: string): AuthoredBlock => ({
  kind: "paragraph",
  text,
});

const heading = (depth: HeadingDepth, text: string): AuthoredBlock => ({
  depth,
  kind: "heading",
  text,
});

const LEDE =
  "Cache Components splits a route into a shell that can be prerendered and holes that stay dynamic. The split is the whole idea, and most of the confusion around it comes from not knowing which side a given piece of markup landed on.";

const FILLER = [
  "The shell is everything the build can resolve without a request. It is emitted once, served from the edge, and never re-rendered for an individual visitor. A hole is the opposite: it needs something only the request knows, so it is streamed in afterwards.",
  "That distinction shows up in the smallest places. Reading a cookie in a layout pulls the whole layout into the dynamic half. Reading it in a leaf component pulls only that leaf. The framework will not warn you about the difference — the build simply gets slower and the shell gets smaller.",
  "In practice the useful habit is to push every request-dependent read as deep into the tree as it will go, then wrap it in a boundary so the shell above it can still be prerendered. The result is a page that paints immediately and fills in.",
  "Measure the shell, not the page. A route that prerenders 90 percent of its markup and streams the rest will beat a fully dynamic route on every metric that matters, even though both eventually render the same HTML.",
] as const;

const filler = (index: number): AuthoredBlock =>
  paragraph(FILLER[index % FILLER.length] ?? FILLER[0]);

const LONG_HEADINGS: readonly (readonly [HeadingDepth, string])[] = [
  [2, "What a cache component is"],
  [3, "The static shell"],
  [3, "The dynamic hole"],
  [2, "Choosing a boundary"],
  [3, "Boundaries in layouts"],
  [4, "Cookies and headers"],
  [4, "Draft mode"],
  [2, "Revalidation"],
  [3, "Time-based profiles"],
  [2, "Measuring the shell"],
  [3, "Reading the build output"],
  [2, "When not to adopt this yet"],
];

const longBody: readonly AuthoredBlock[] = [
  paragraph(LEDE),
  ...LONG_HEADINGS.flatMap(([depth, text], index) => [
    heading(depth, text),
    filler(index),
    filler(index + 1),
  ]),
];

const shortBody: readonly AuthoredBlock[] = [
  paragraph(LEDE),
  heading(2, "What a cache component is"),
  filler(0),
  heading(2, "Choosing a boundary"),
  filler(1),
  heading(2, "When not to adopt this yet"),
  filler(2),
];

const noHeadingBody: readonly AuthoredBlock[] = [
  paragraph(LEDE),
  filler(0),
  filler(1),
  filler(2),
];

const panelBody: readonly AuthoredBlock[] = [
  paragraph(LEDE),
  heading(2, "Setting up a route"),
  filler(0),
  // Panel titles are Radix headers without an id, so they never reach the table
  // of contents; only headings authored inside a panel body do. The titles and
  // the headings differ here so that distinction is legible on screen.
  {
    items: [
      {
        blocks: [heading(3, "Enabling the flag"), filler(1)],
        title: "Next 16 and later",
      },
      {
        blocks: [heading(3, "Opting a route out"), filler(2)],
        title: "Legacy routes",
      },
    ],
    kind: "accordion",
  },
  heading(2, "Per-runtime differences"),
  filler(3),
  {
    kind: "tabs",
    tabs: [
      {
        blocks: [heading(3, "Node.js runtime"), filler(0)],
        title: "Node.js",
      },
      {
        blocks: [heading(3, "Edge runtime"), filler(1)],
        title: "Edge",
      },
      // Two panels deep, and closed on both levels: the case a reveal walk has
      // to open in order, outermost first, because the inner control is not in
      // the document's layout until the outer panel is open.
      {
        blocks: [
          filler(2),
          {
            items: [
              {
                blocks: [heading(4, "Streaming across runtimes"), filler(0)],
                title: "Streaming",
              },
            ],
            kind: "accordion",
          },
        ],
        title: "Both",
      },
    ],
  },
  heading(2, "Wrapping up"),
  filler(2),
];

const AUTHORED_BODIES: Record<ContentShape, readonly AuthoredBlock[]> = {
  long: longBody,
  none: noHeadingBody,
  panels: panelBody,
  short: shortBody,
};

const resolveBlocks = (
  blocks: readonly AuthoredBlock[],
  slugger: GithubSlugger,
  headings: ArticleHeadingFact[]
): readonly ResolvedBlock[] =>
  blocks.map((block) => {
    if (block.kind === "heading") {
      const id = slugger.slug(block.text);
      headings.push({ depth: block.depth, id, text: block.text });
      return { depth: block.depth, id, kind: "heading", text: block.text };
    }

    if (block.kind === "accordion") {
      return {
        items: block.items.map((item) => ({
          blocks: resolveBlocks(item.blocks, slugger, headings),
          title: item.title,
        })),
        kind: "accordion",
      };
    }

    if (block.kind === "tabs") {
      return {
        kind: "tabs",
        tabs: block.tabs.map((tab) => ({
          blocks: resolveBlocks(tab.blocks, slugger, headings),
          title: tab.title,
        })),
      };
    }

    return block;
  });

const resolveBody = (shape: ContentShape): ResolvedBody => {
  const slugger = new GithubSlugger();
  const headings: ArticleHeadingFact[] = [];
  const blocks = resolveBlocks(AUTHORED_BODIES[shape], slugger, headings);
  return { blocks, headings };
};

const RESOLVED_BODIES: Record<ContentShape, ResolvedBody> = {
  long: resolveBody("long"),
  none: resolveBody("none"),
  panels: resolveBody("panels"),
  short: resolveBody("short"),
};

export const getPrototypeBody = (shape: ContentShape): ResolvedBody =>
  RESOLVED_BODIES[shape];

export interface PrototypeNeighbour {
  readonly href: `/blog/${string}`;
  readonly title: string;
}

const PREVIOUS_NEIGHBOUR: PrototypeNeighbour = {
  href: "/blog/type-safe-routes",
  title: "Type-safe routes without a code generator",
};

const NEXT_NEIGHBOUR: PrototypeNeighbour = {
  href: "/blog/measuring-image-budgets-in-ci",
  title:
    "Measuring image budgets in CI before they reach a visitor's connection",
};

interface PrototypeNeighbours {
  readonly next: PrototypeNeighbour | null;
  readonly previous: PrototypeNeighbour | null;
}

const NEIGHBOURS: Record<Neighbourhood, PrototypeNeighbours> = {
  both: { next: NEXT_NEIGHBOUR, previous: PREVIOUS_NEIGHBOUR },
  next: { next: NEXT_NEIGHBOUR, previous: null },
  none: { next: null, previous: null },
  previous: { next: null, previous: PREVIOUS_NEIGHBOUR },
};

export const getPrototypeNeighbours = (
  neighbourhood: Neighbourhood
): PrototypeNeighbours => NEIGHBOURS[neighbourhood];
