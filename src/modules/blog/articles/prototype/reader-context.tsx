// PROTOTYPE — throwaway. Delete this directory once issue #33 is decided.
//
// One reader model, three compositions. Everything a variant needs sits here so
// the variants stay pure arrangement.

"use client";

import { createContext, use, useMemo, useState } from "react";

import type { Tag } from "@/modules/blog/articles/tags";

import type { PrototypeNeighbour, ResolvedBody } from "./fixtures";
import { getPrototypeNeighbours } from "./fixtures";
import { useFocusMode } from "./focus-control";
import type { PrototypeSelection } from "./params";
import { useActiveHeadingId } from "./toc-navigation";

export interface ReaderArticle {
  readonly description: string;
  readonly slug: string;
  readonly tags: readonly Tag[];
  readonly title: string;
}

interface ReaderContextValue {
  readonly actions: {
    readonly announceNeighbour: (neighbour: PrototypeNeighbour) => void;
    readonly toggleFocus: () => void;
  };
  readonly meta: {
    readonly article: ReaderArticle;
    readonly body: ResolvedBody;
    readonly next: PrototypeNeighbour | null;
    readonly previous: PrototypeNeighbour | null;
    readonly selection: PrototypeSelection;
    readonly url: string;
  };
  readonly state: {
    readonly activeHeadingId: string | null;
    readonly chrome: "dim" | "hide" | undefined;
    readonly focusAvailable: boolean;
    readonly focusEngaged: boolean;
    readonly focusLabel: string;
    readonly notice: string | null;
  };
}

const ReaderContext = createContext<ReaderContextValue | null>(null);

const NOTICE_MS = 2400;

export const useReader = (): ReaderContextValue => {
  const value = use(ReaderContext);

  if (value === null) {
    throw new Error("useReader must be used inside ReaderProvider");
  }

  return value;
};

export const ReaderProvider = ({
  article,
  body,
  children,
  selection,
}: {
  readonly article: ReaderArticle;
  readonly body: ResolvedBody;
  readonly children: React.ReactNode;
  readonly selection: PrototypeSelection;
}) => {
  const { next, previous } = getPrototypeNeighbours(selection.neighbourhood);
  const activeHeadingId = useActiveHeadingId(body.headings);
  const focus = useFocusMode(selection.focus);
  const [notice, setNotice] = useState<string | null>(null);

  const value = useMemo<ReaderContextValue>(
    () => ({
      actions: {
        announceNeighbour: (neighbour) => {
          setNotice(`${neighbour.title} — fixture Article, no route to open`);
          window.setTimeout(() => {
            setNotice(null);
          }, NOTICE_MS);
        },
        toggleFocus: focus.toggle,
      },
      meta: {
        article,
        body,
        next,
        previous,
        selection,
        url: `https://levinkeller.de/blog/${article.slug}`,
      },
      state: {
        activeHeadingId,
        chrome: focus.chrome,
        focusAvailable: focus.available,
        focusEngaged: focus.engaged,
        focusLabel: focus.label,
        notice,
      },
    }),
    [
      activeHeadingId,
      article,
      body,
      focus.available,
      focus.chrome,
      focus.engaged,
      focus.label,
      focus.toggle,
      next,
      notice,
      previous,
      selection,
    ]
  );

  return <ReaderContext value={value}>{children}</ReaderContext>;
};
