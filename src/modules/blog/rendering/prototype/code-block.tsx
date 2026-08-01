// PROTOTYPE — throwaway. Delete this directory once issue #34 is decided.
//
// A copy of production's `ArticleCodeBlock` with two changes the presentation
// language needs and CSS cannot reach:
//
//   1. The copy control is the shared, accessible `CopyButton` — copied/error
//      states, live region, sound, reduced-motion branch — instead of
//      `rendering/copy-button.tsx`, which is a bare `<button>Copy</button>`.
//   2. `lineNumbers` is published as `--line-start` so the CSS counter can start
//      where the author said it does.
//
// Both are findings for #37, not licence to change production here.

import type { ComponentPropsWithoutRef, CSSProperties } from "react";

import { CopyButton } from "@/shared/ui/copy-button";

type StyleWithCustomProperties = CSSProperties &
  Record<`--${string}`, number | string>;

type PrototypeCodeBlockProps = ComponentPropsWithoutRef<"pre"> & {
  readonly "data-code-tab-label"?: string;
  readonly "data-code-title"?: string;
  readonly "data-copy-source"?: string;
  readonly "data-line-numbers-start"?: number;
  readonly "data-twoslash"?: string;
};

export const PrototypeCodeBlock = ({
  "data-code-tab-label": _tabLabel,
  "data-code-title": title,
  "data-copy-source": copySource,
  "data-line-numbers-start": lineNumbersStart,
  "data-twoslash": twoslash,
  children,
  ...props
}: PrototypeCodeBlockProps) => {
  const style: StyleWithCustomProperties | undefined =
    lineNumbersStart === undefined
      ? undefined
      : { "--line-start": lineNumbersStart };

  return (
    <figure
      data-code-block=""
      data-line-numbers-start={lineNumbersStart}
      data-twoslash={twoslash}
      style={style}
    >
      {title === undefined && copySource === undefined ? null : (
        <figcaption>
          {title === undefined ? null : <span>{title}</span>}
          {copySource === undefined ? null : (
            <CopyButton
              aria-label="Copy code"
              className="size-7 border-none"
              text={copySource}
              variant="ghost"
            />
          )}
        </figcaption>
      )}
      <pre {...props}>{children}</pre>
    </figure>
  );
};
