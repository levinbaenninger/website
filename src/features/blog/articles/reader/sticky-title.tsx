"use client";

import { useEffect, useState } from "react";

import { cn } from "@/shared/ui/cn";

import { ARTICLE_TITLE_SLOT, STICKY_CHROME_PX } from "./reader-contract";

// Hydrates because a scroll position is not knowable on the server. Always `aria-hidden`: the `h1` stays in the tree, so a second copy would be a duplicate.
// Found by slot rather than a ref: the `h1` is a server-rendered sibling, and a ref cannot cross that boundary.
export const StickyArticleTitle = ({ title }: { readonly title: string }) => {
  const [behindChrome, setBehindChrome] = useState(false);

  useEffect(() => {
    const heading = document.querySelector(
      `[data-slot="${ARTICLE_TITLE_SLOT}"]`
    );

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
