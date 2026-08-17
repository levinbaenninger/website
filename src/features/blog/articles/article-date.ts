import { format, parseISO } from "date-fns";

// Shared by catalog and reader, so it lives with the Article rather than in
// either presentation.
export const formatArticleDate = (isoDate: string): string =>
  format(parseISO(isoDate), "dd.MM.yyyy");
