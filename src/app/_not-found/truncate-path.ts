const MAX_DISPLAY_LENGTH = 34;
const ELLIPSIS = "…";
const ROOT_PATH = "/";

/**
 * Shortens a pathname for the plotter readout. The trailing segment survives
 * because it names the address the visitor actually asked for.
 */
export const truncatePath = (pathname: string): string => {
  if (pathname === "") {
    return ROOT_PATH;
  }

  if (pathname.length <= MAX_DISPLAY_LENGTH) {
    return pathname;
  }

  const tail = pathname.slice(-(MAX_DISPLAY_LENGTH - ELLIPSIS.length));

  return `${ELLIPSIS}${tail}`;
};
