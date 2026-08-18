import type { ReactNode } from "react";

export const flattenChildren = (children: ReactNode): ReactNode[] => {
  if (
    children === null ||
    children === undefined ||
    children === true ||
    children === false
  ) {
    return [];
  }

  if (Array.isArray(children)) {
    return children.flatMap((child: ReactNode) => flattenChildren(child));
  }

  return [children];
};
