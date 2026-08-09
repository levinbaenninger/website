import { createElement } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";

/**
 * Custom element used for Accordion, Tabs, and Code Tabs panels.
 *
 * A dedicated tag keeps `hidden="until-found"` (find-in-page) and
 * `data-article-panel` on one host that Radix can `asChild` into. Typed here so
 * callers do not need a JSX intrinsic ambient declaration.
 */
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
