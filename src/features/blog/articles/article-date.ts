import { format, parseISO } from "date-fns";

export const formatArticleDate = (isoDate: string): string =>
  format(parseISO(isoDate), "dd.MM.yyyy");
