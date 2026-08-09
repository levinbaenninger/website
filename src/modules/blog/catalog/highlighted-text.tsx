// The service rather than the client entrypoint: this renders inside cards the
// server prerenders, and the entrypoint carries `"use client"`.
import type { HighlightedText as HighlightedTextValue } from "@/modules/blog/search/service";

/**
 * Text with the parts a query matched wrapped in `<mark>`.
 *
 * Semantic `<mark>` rather than a styled span: the highlight is what explains
 * why a result is on the page, and assistive technology should be able to say
 * so. The treatment is a tint at unchanged weight — a bolded highlight would
 * re-rank the card's typography every keystroke.
 *
 * Ranges arrive sorted, merged and end-exclusive from the search service, so
 * this walks them once and never has to reconcile overlaps.
 */
export const HighlightedText = ({ value }: { value: HighlightedTextValue }) => {
  const { highlights, text } = value;

  if (highlights.length === 0) {
    return text;
  }

  let cursor = 0;
  const parts: React.ReactNode[] = [];

  for (const { end, start } of highlights) {
    if (start > cursor) {
      parts.push(text.slice(cursor, start));
    }
    parts.push(
      <mark className="bg-foreground/10 text-inherit" key={`${start}-${end}`}>
        {text.slice(start, end)}
      </mark>
    );
    cursor = end;
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
};
