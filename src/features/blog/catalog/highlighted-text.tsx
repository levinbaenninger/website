// No `"use client"`: this renders inside server-prerendered cards.
import type { HighlightedText as HighlightedTextValue } from "@/features/blog/search/service";

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
