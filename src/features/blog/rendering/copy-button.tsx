// The CodeBlock's copy control.
//
// The source it copies is the compiler's `data-copy-source`, not the rendered
// tokens: annotation comments, Twoslash queries and expected-error directives
// are stripped there, and the line numbers never existed as text at all — they
// are a CSS counter. What lands on the clipboard is what the author wrote.
//
// It is the shared `CopyButton` rather than a Blog-local one, so the copied and
// failed states, the polite live region, the feedback sound, the vibration and
// the reduced-motion branch are the ones the rest of the site already has.

import { CopyButton } from "@/shared/ui/copy-button";

export const ArticleCopyButton = ({ source }: { readonly source: string }) => (
  <CopyButton
    aria-label="Copy code"
    className="size-7 border-none"
    data-article-code-copy=""
    text={source}
    variant="ghost"
  />
);
