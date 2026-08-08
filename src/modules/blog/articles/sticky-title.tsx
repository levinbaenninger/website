"use client";

import { useEffect, useState } from "react";

import { cn } from "@/shared/ui/cn";

import { ARTICLE_TITLE_SLOT, STICKY_CHROME_PX } from "./reader-contract";

/**
 * The toolbar's copy of the Article title.
 *
 * The only part of the reader chrome that hydrates. Everything else the toolbar
 * carries — the Blog link, the neighbour links, the pager — is a real link
 * rendered on the server; this element exists because a scroll position is not
 * knowable there.
 *
 * It is `aria-hidden` at every scroll position, not only while invisible: the
 * semantic `h1` stays in the accessibility tree the whole way down the page, so
 * a second copy of the same sentence would only ever be a duplicate.
 *
 * The title is found by its slot rather than handed down as a ref, because the
 * `h1` is server-rendered by a sibling and a ref cannot cross that boundary.
 */
export const StickyArticleTitle = ({ title }: { readonly title: string }) => {
  const [behindChrome, setBehindChrome] = useState(false);

  useEffect(() => {
    const heading = document.querySelector(
      `[data-slot="${ARTICLE_TITLE_SLOT}"]`
    );

    // The negative top margin shrinks the observer root by the height of the
    // fixed chrome, so the title counts as gone the moment it slides under the
    // toolbar rather than 92 px later when it leaves the viewport — which is
    // exactly the window in which nothing on screen says which Article this is.
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);

        if (entry !== undefined) {
          setBehindChrome(!entry.isIntersecting);
        }
      },
      { rootMargin: `-${STICKY_CHROME_PX}px 0px 0px 0px`, threshold: 0 }
    );

    if (heading !== null) {
      observer.observe(heading);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <p
      aria-hidden
      className={cn(
        "min-w-0 truncate text-center text-sm font-medium transition-opacity duration-200 motion-reduce:transition-none",
        behindChrome ? "opacity-100" : "opacity-0"
      )}
      data-behind-chrome={behindChrome}
    >
      {title}
    </p>
  );
};
