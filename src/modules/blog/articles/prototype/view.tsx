// PROTOTYPE — throwaway. Delete this directory once issue #33 is decided.
//
// Entry point mounted by /blog/[slug] in development only.

"use client";

import { getPrototypeBody } from "./fixtures";
import type { PrototypeSelection } from "./params";
import { PrototypeSwitcher } from "./prototype-switcher";
import type { ReaderArticle } from "./reader-context";
import { ReaderProvider } from "./reader-context";
import {
  LinedMetaReader,
  ReferenceStrictReader,
  StickyToolbarReader,
} from "./reader-variants";

const READERS: Record<PrototypeSelection["variant"], () => React.ReactElement> =
  {
    a: ReferenceStrictReader,
    b: LinedMetaReader,
    c: StickyToolbarReader,
  };

export const ArticleReaderPrototype = ({
  article,
  selection,
}: {
  readonly article: ReaderArticle;
  readonly selection: PrototypeSelection;
}) => {
  const Reader = READERS[selection.variant];

  return (
    <>
      <ReaderProvider
        article={article}
        body={getPrototypeBody(selection.content)}
        selection={selection}
      >
        <Reader />
      </ReaderProvider>

      <PrototypeSwitcher {...selection} />
    </>
  );
};
