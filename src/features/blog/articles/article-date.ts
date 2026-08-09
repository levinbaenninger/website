import { format, parseISO } from "date-fns";

/**
 * The one visible Article date format, `dd.MM.yyyy`, accepted on #32. The
 * catalog and the reader both render it, so it lives with the Article rather
 * than in either presentation.
 *
 * The machine-readable value is always the untouched ISO date on `time`.
 */
export const formatArticleDate = (isoDate: string): string =>
  format(parseISO(isoDate), "dd.MM.yyyy");
