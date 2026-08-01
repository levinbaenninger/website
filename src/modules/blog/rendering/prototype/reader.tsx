// PROTOTYPE — throwaway. Delete this directory once issue #34 is decided.
//
// The chrome around the specimen. Issue #33 already settled it, so nothing here
// is under test: this is its accepted composition — C's sticky toolbar, the
// gutter minimap opened by click, `jump=reveal` — reduced to the pieces the
// prose column has to be judged inside. Share, previous/next and the focus
// control are left out; they say nothing about what an Article *reads* like.
//
// The chrome primitives are imported from `articles/prototype/` rather than
// re-derived, so the rail width, the opening offset and the `--doc-cols-top`
// measurement stay the ones #33 measured. Both directories go away together.
//
// `data-article-language` sits on the body wrapper, not on the column, so the
// presentation language reaches Article content and nothing else: the back link,
// the title and the table of contents are chrome and keep the shell's own
// treatment.

"use client";

import { useReducedMotion } from "motion/react";

import type { ArticleHeadingFact } from "@/modules/blog/articles/facts";
import {
  ArticleMeta,
  BackToBlog,
  ProseColumn,
  ReaderBottomLine,
  ReaderGrid,
  ReaderGutter,
  ReaderRail,
  ReaderRoot,
  ReaderTitle,
  ReaderTitleSpacer,
  ReaderTopLine,
  useTitleBehindChrome,
} from "@/modules/blog/articles/prototype/reader-chrome";
import { TocInline, TocMinimap } from "@/modules/blog/articles/prototype/toc";
import { useActiveHeadingId } from "@/modules/blog/articles/prototype/toc-navigation";
import type { Tag } from "@/modules/blog/articles/tags";
import { cn } from "@/shared/ui/cn";

import type { LanguageSelection } from "./params";
import { PrototypeSwitcher } from "./switcher";

import "@shikijs/twoslash/style-rich.css";
import "./language.css";

export interface SpecimenArticle {
  readonly description: string;
  readonly tags: readonly Tag[];
  readonly title: string;
}

const StickyToolbar = ({ title }: { readonly title: string }) => {
  const titleBehindChrome = useTitleBehindChrome();
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div className="sticky top-12 z-40 bg-background/85 backdrop-blur">
      <ReaderRail className="screen-line-bottom flex items-center gap-2 p-2 pl-4">
        <div className="flex flex-1 basis-0 justify-start">
          <BackToBlog />
        </div>

        <p
          aria-hidden={!titleBehindChrome}
          className={cn(
            "min-w-0 truncate text-center text-sm font-medium",
            reducedMotion
              ? "transition-none"
              : "transition-opacity duration-200",
            titleBehindChrome ? "opacity-100" : "opacity-0"
          )}
        >
          {title}
        </p>

        <div className="flex flex-1 basis-0 justify-end" />
      </ReaderRail>
    </div>
  );
};

export const SpecimenReader = ({
  article,
  children,
  headings,
  selection,
}: {
  readonly article: SpecimenArticle;
  readonly children: React.ReactNode;
  readonly headings: readonly ArticleHeadingFact[];
  readonly selection: LanguageSelection;
}) => {
  const activeHeadingId = useActiveHeadingId(headings);

  return (
    <>
      <ReaderRoot className="flex flex-1 flex-col">
        <ReaderRail>
          <ReaderTopLine />
        </ReaderRail>

        <StickyToolbar title={article.title} />

        <ReaderRail>
          {/* The toolbar's own bottom rule is this strip's top rule. */}
          <ReaderTitleSpacer className="screen-line-top-none" />
          <ReaderTitle>{article.title}</ReaderTitle>

          <div className="screen-line-bottom flex flex-col gap-2 px-4 py-4">
            <p className="text-base/7 text-pretty text-muted-foreground">
              {article.description}
            </p>
            <ArticleMeta state="published" tags={article.tags} />
          </div>
        </ReaderRail>

        <ReaderGrid>
          <ReaderGutter />

          <ReaderRail>
            {/* #33's opening-offset correction: `pt-3` where the prose opens the
                column, the full `pt-8` where the marginless card does. */}
            <ProseColumn className="lg:pt-3">
              <TocInline
                activeId={activeHeadingId}
                className="lg:hidden"
                headings={headings}
                jump="reveal"
              />

              <div
                data-article-language={selection.language}
                data-copy={selection.copy}
                data-motion={selection.motion}
              >
                {children}
              </div>
            </ProseColumn>

            <ReaderBottomLine />
          </ReaderRail>

          <ReaderGutter>
            <div className="sticky top-[calc(var(--doc-cols-top,0px)+(--spacing(3)))] translate-x-2 opacity-0 in-data-doc-cols-ready:opacity-100">
              <TocMinimap
                activeId={activeHeadingId}
                headings={headings}
                jump="reveal"
                reveal="gutter-click"
              />
            </div>
          </ReaderGutter>
        </ReaderGrid>
      </ReaderRoot>

      <PrototypeSwitcher {...selection} />
    </>
  );
};
