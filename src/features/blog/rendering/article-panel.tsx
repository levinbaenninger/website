import { createElement } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";

// Custom element so hidden="until-found" and data-article-panel live on one host.
export const ArticlePanel = ({
  children,
  hidden,
  ref,
  style,
  ...props
}: Omit<HTMLAttributes<HTMLElement>, "hidden"> & {
  readonly children?: ReactNode;
  readonly hidden?: boolean | "until-found";
  readonly ref?: Ref<HTMLElement>;
  readonly style?: CSSProperties;
}) =>
  createElement(
    "article-panel",
    {
      ...props,
      hidden,
      ref,
      style,
    },
    children
  );
