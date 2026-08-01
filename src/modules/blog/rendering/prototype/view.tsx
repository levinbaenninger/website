// PROTOTYPE — throwaway. Delete this directory once issue #34 is decided.
//
// Server entry. The specimen is compiled by the real pipeline — `next.config.ts`
// applies `createArticleMdxOptions` to every `.mdx` import — so the Shiki spans,
// the Twoslash markup, the GFM task-list classes, the `data-copy-source`
// attributes and the heading ids on screen are the ones a real Article would
// produce. The specimens are imported directly rather than added to `content/`,
// so `manifest.generated.ts`, the catalog, the search artifact, the sitemap and
// the social images are all untouched.
//
// This module reads the specimen's compilation facts — frontmatter for the
// header, headings for the table of contents — and hands the body itself to
// `SpecimenContent`, which renders it client-side. See NOTES finding 1 for why.

import { z } from "zod";

import { resolveTag } from "@/modules/blog/articles/tags";
import type { Tag } from "@/modules/blog/articles/tags";

import type { LanguageSelection, Specimen } from "./params";
import { SpecimenReader } from "./reader";
import { SpecimenContent } from "./specimen-content";

// Imported lazily, not statically. `src/modules/blog/index.ts` re-exports this
// module, and Vitest resolves that entrypoint's whole static graph without an
// MDX transform — a static `import … from "./specimen.mdx"` fails the suite for
// every test that reaches the Blog entrypoint. A dynamic import is only
// resolved when it runs, which is never under test.
const loadSpecimenFacts = async (specimen: Specimen) =>
  specimen === "stress"
    ? await import("./stress.mdx")
    : await import("./specimen.mdx");

// `src/mdx.d.ts` types every Article's `frontmatter` as `unknown`, which is the
// right default for authored content. Production narrows it with
// `validateArticleMetadata`; the specimen only needs the three fields the header
// shows, so it parses just those.
const specimenFrontmatter = z.object({
  description: z.string(),
  tags: z.array(z.string()),
  title: z.string(),
});

const resolveTags = (ids: readonly string[]): readonly Tag[] =>
  ids.flatMap((id) => {
    const tag = resolveTag(id);
    return tag === undefined ? [] : [tag];
  });

export const ArticleLanguagePrototype = async ({
  selection,
}: {
  readonly selection: LanguageSelection;
}) => {
  const facts = await loadSpecimenFacts(selection.specimen);
  const { description, tags, title } = specimenFrontmatter.parse(
    facts.frontmatter
  );

  return (
    <SpecimenReader
      article={{ description, tags: resolveTags(tags), title }}
      headings={facts.__articleFacts.headings}
      selection={selection}
    >
      <SpecimenContent
        anchor={selection.anchor}
        specimen={selection.specimen}
      />
    </SpecimenReader>
  );
};
