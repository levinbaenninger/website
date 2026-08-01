// PROTOTYPE — throwaway. Delete this directory once issue #32 is decided.
//
// Representative Article fixtures shaped exactly like the production contracts
// (`ArticleSummary`, `ArticleTagFacet`, `ArticleSearchDocument`) so the catalog
// variants are judged against real data shapes: a long title, an updated
// Article, a Draft, Tag overflow, and a body long enough to crop a snippet.

import type { Tag } from "@/modules/blog/articles/tags";
import type {
  ArticleSearchDocument,
  ArticleSummary,
  ArticleTagFacet,
} from "@/modules/blog/articles/types";

import cacheComponentsCover from "./covers/cache-components.png";
import draftNotesCover from "./covers/draft-notes.png";
import imageBudgetsCover from "./covers/image-budgets.png";
import streamingSuspenseCover from "./covers/streaming-suspense.png";
import testSeamsCover from "./covers/test-seams.png";
import typeSafeRoutesCover from "./covers/type-safe-routes.png";

// Prototype-only Tags. Production `TAGS` has two entries, which cannot exercise
// facet wrapping, counts, or overflow. The content contract is not reopened.
const TAG = {
  css: { id: "css", label: "CSS" },
  dx: { id: "dx", label: "Developer experience" },
  nextjs: { id: "nextjs", label: "Next.js" },
  react: { id: "react", label: "React" },
  testing: { id: "testing", label: "Testing" },
  tooling: { id: "tooling", label: "Tooling" },
  typescript: { id: "typescript", label: "TypeScript" },
  webPerformance: { id: "web-performance", label: "Web performance" },
} as const satisfies Record<string, Tag>;

export const PROTOTYPE_ARTICLES: readonly ArticleSummary[] = [
  {
    slug: "understanding-cache-components",
    href: "/blog/understanding-cache-components",
    title: "Understanding Cache Components in Next.js 16",
    description:
      "How the new caching model changes the way a static Blog is rendered, and which defaults are worth keeping.",
    cover: cacheComponentsCover,
    tags: [TAG.nextjs, TAG.webPerformance],
    status: "published",
    publishedAt: "2026-07-12",
    updatedAt: "2026-07-24",
  },
  {
    slug: "streaming-server-components",
    href: "/blog/streaming-server-components",
    title: "Streaming Server Components without layout shift",
    description:
      "Suspense boundaries are a layout decision before they are a loading decision.",
    cover: streamingSuspenseCover,
    tags: [TAG.react, TAG.nextjs],
    status: "published",
    publishedAt: "2026-06-28",
    updatedAt: null,
  },
  {
    slug: "image-performance-budgets",
    href: "/blog/image-performance-budgets",
    title:
      "A performance budget for images that survives contact with a real content pipeline",
    description:
      "Budgets fail when they live in a spreadsheet. This one lives in the build.",
    cover: imageBudgetsCover,
    tags: [TAG.webPerformance, TAG.css, TAG.tooling],
    status: "published",
    publishedAt: "2026-05-30",
    updatedAt: "2026-07-02",
  },
  {
    slug: "type-safe-routes",
    href: "/blog/type-safe-routes",
    title: "Type-safe routes without a code generator",
    description:
      "Template literal types can carry a route contract further than most generators do.",
    cover: typeSafeRoutesCover,
    tags: [TAG.typescript, TAG.dx],
    status: "published",
    publishedAt: "2026-04-18",
    updatedAt: null,
  },
  {
    slug: "designing-test-seams",
    href: "/blog/designing-test-seams",
    title: "Designing test seams you will not regret",
    description:
      "A seam is a design decision. Injecting a fetch is cheaper than mocking a module.",
    cover: testSeamsCover,
    tags: [TAG.testing, TAG.typescript, TAG.dx],
    status: "published",
    publishedAt: "2026-03-09",
    updatedAt: null,
  },
  {
    slug: "partial-prerendering-notes",
    href: "/blog/partial-prerendering-notes",
    title: "Working notes on partial prerendering",
    description:
      "Unfinished thinking about the boundary between the shell and the dynamic hole.",
    cover: draftNotesCover,
    tags: [TAG.nextjs, TAG.dx],
    status: "draft",
    publishedAt: null,
    updatedAt: null,
  },
];

const countArticles = (tag: Tag): number =>
  PROTOTYPE_ARTICLES.filter((article) =>
    article.tags.some((articleTag) => articleTag.id === tag.id)
  ).length;

export const PROTOTYPE_TAGS: readonly ArticleTagFacet[] = Object.values(TAG)
  .map((tag) => ({ ...tag, articleCount: countArticles(tag) }))
  .toSorted((left, right) => left.label.localeCompare(right.label));

// Bodies must stay single-line and whitespace-collapsed: the search artifact
// contract rejects anything that is not already normalized.
const BODIES: Record<string, string> = {
  "understanding-cache-components":
    "Cache Components replace the implicit route-level caching model with an explicit one. A component opts into a cache profile, and the framework proves at build time that every dynamic hole is either prerendered or streamed. In practice this makes a static Blog faster to reason about: the catalog is fully prerendered, the search artifact is a plain static asset, and the only dynamic surface left is the Draft preview that never ships to production. The migration is mostly about deleting revalidate flags that were guesses.",
  "streaming-server-components":
    "A Suspense boundary decides what the visitor sees before the data arrives, which makes it a layout decision first. If the fallback has a different height than the resolved content, the page jumps, and the visitor pays for streaming with a worse experience than a blocking render would have given them. Reserve the space, match the intrinsic size of the cover image, and only then stream. Measure with a slow network profile rather than a local build.",
  "image-performance-budgets":
    "Every image budget dies in a spreadsheet. The version that survives is the one the build enforces: a validation step reads the Article source bundle, checks that each Cover is the declared aspect ratio, and fails the build when a decorative asset crosses the byte budget. Authors get the error at authoring time, not in a monthly audit. The budget is boring, which is the point, and boring budgets are the only kind anyone keeps.",
  "type-safe-routes":
    "Template literal types carry a surprising amount of routing contract. A canonical Article href typed as a template literal cannot silently drift from the slug it was derived from, which removes an entire class of broken link. A generator would give the same guarantee at the price of a build step, a generated file in review, and a stale artifact whenever someone forgets to run it.",
  "designing-test-seams":
    "A seam is where a test replaces production behavior, and the shape of that seam is a design decision rather than a testing detail. Injecting a fetch function into a loader is cheaper than mocking a module, survives refactoring, and keeps the production wiring in one place. When the seam is a parameter, the test reads like the documentation for the contract.",
  "partial-prerendering-notes":
    "Unfinished notes. The interesting boundary is between the prerendered shell and the dynamic hole, and most confusion comes from treating that boundary as a caching concern instead of a rendering one. Worth revisiting once the Draft workflow is settled.",
};

const HEADINGS: Record<string, readonly string[]> = {
  "understanding-cache-components": [
    "What changed",
    "Cache profiles",
    "Migrating a static Blog",
  ],
  "streaming-server-components": [
    "Boundaries are layout",
    "Reserving space",
    "Measuring on a slow network",
  ],
  "image-performance-budgets": [
    "Why budgets fail",
    "Enforcing at build time",
    "Cover aspect ratios",
  ],
  "type-safe-routes": ["Template literal hrefs", "Why not a generator"],
  "designing-test-seams": ["Seams are design", "Injecting a fetch"],
  "partial-prerendering-notes": ["Open questions"],
};

export const PROTOTYPE_SEARCH_DOCUMENTS: readonly ArticleSearchDocument[] =
  PROTOTYPE_ARTICLES.map((article) => ({
    id: article.slug,
    href: article.href,
    title: article.title,
    description: article.description,
    tags: article.tags,
    headings: HEADINGS[article.slug] ?? [],
    body: BODIES[article.slug] ?? "",
    status: article.status,
  }));
