// PROTOTYPE — throwaway. Delete this directory once issue #34 is decided.
//
// The heading anchor, which the production `ArticleHeading*` components do not
// have: they render a bare `h2`–`h6` carrying the compiled id and nothing else.
// Transposed from ncdai/chanhdai.com @ 83e0b842 `src/components/heading.tsx`
// (MIT, © Chánh Đại), whose shape is: the heading text *is* the anchor, and a
// copy-link button fades in beside it on hover.
//
// `leading` and `none` exist because the reference's answer is hover-only, and
// this repository's own acceptance checklist from #31 says no heading-link
// control may be.

import type { ComponentPropsWithoutRef } from "react";

import { HeadingCopyLink } from "./heading-copy";
import type { HeadingAnchor } from "./params";

type HeadingLevel = "h2" | "h3" | "h4" | "h5" | "h6";

export const createPrototypeHeading = (
  level: HeadingLevel,
  anchor: HeadingAnchor
) => {
  const Tag = level;

  const PrototypeHeading = ({
    children,
    id,
    ...props
  }: ComponentPropsWithoutRef<HeadingLevel>) => {
    if (id === undefined || anchor === "none") {
      return (
        <Tag {...props} id={id}>
          {children}
        </Tag>
      );
    }

    return (
      <Tag {...props} id={id}>
        {anchor === "leading" ? (
          <a
            aria-label="Link to this section"
            data-heading-anchor="leading"
            href={`#${id}`}
          >
            #
          </a>
        ) : null}

        {anchor === "wrap" ? (
          <a data-heading-anchor="wrap" href={`#${id}`}>
            {children}
          </a>
        ) : (
          children
        )}

        <HeadingCopyLink id={id} />
      </Tag>
    );
  };

  return PrototypeHeading;
};
