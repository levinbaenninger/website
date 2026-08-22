const MAX_DISPLAY_LENGTH = 34;
const ELLIPSIS = "…";
const ROOT_PATH = "/";

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
