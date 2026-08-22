import { differenceInMonths, parse } from "date-fns";

export const formatDuration = (
  startDate: string,
  endDate: string | null,
  currentDate = new Date()
) => {
  const start = parse(startDate, "MM.yyyy", new Date());
  const end =
    endDate === null ? currentDate : parse(endDate, "MM.yyyy", new Date());
  const totalMonths = differenceInMonths(end, start) + 1;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0) {
    return `${months}m`;
  }

  if (months === 0) {
    return `${years}y`;
  }

  return `${years}y ${months}m`;
};
