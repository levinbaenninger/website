import type { DetailedHTMLProps, HTMLAttributes, Ref } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      readonly "article-panel": DetailedHTMLProps<
        Omit<HTMLAttributes<HTMLElement>, "hidden"> & {
          readonly ref?: Ref<HTMLElement>;
        },
        HTMLElement
      > & {
        readonly hidden?: boolean | "until-found";
      };
    }
  }
}
