const MAX_DISPLAY_LENGTH = 34;
const ELLIPSIS = "…";
const ROOT_PATH = "/";

/** Keep the trailing characters: they name the address the visitor asked for. */
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
