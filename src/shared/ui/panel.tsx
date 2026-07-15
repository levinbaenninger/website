import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "@/shared/ui/cn";

export { PanelTitleCopy } from "@/shared/ui/panel-title-copy";

const Panel = ({ className, ...props }: React.ComponentProps<"section">) => (
  <section
    data-slot="panel"
    className={cn(
      "screen-line-top screen-line-bottom border-x border-line",
      className
    )}
    {...props}
  />
);

const PanelHeader = ({
  className,
  ...props
}: React.ComponentProps<"header">) => (
  <header
    data-slot="panel-header"
    className={cn(
      "screen-line-bottom px-4 has-data-[slot=panel-description]:*:data-[slot=panel-title]:screen-line-bottom",
      className
    )}
    {...props}
  />
);

const PanelVisuallyHiddenHeader = ({
  className,
  ...props
}: React.ComponentProps<"header">) => (
  <header
    data-slot="panel-header"
    className={cn("sr-only", className)}
    {...props}
  />
);

const PanelTitle = ({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"h2"> & { asChild?: boolean }) => {
  const Comp = asChild ? Slot.Root : "h2";

  return (
    <Comp
      data-slot="panel-title"
      className={cn(
        "group/panel-title flex items-center font-heading text-3xl font-medium tracking-tight text-balance",
        className
      )}
      {...props}
    />
  );
};

const PanelTitleSup = ({
  className,
  ...props
}: React.ComponentProps<"sup">) => (
  <sup
    data-slot="panel-title-sup"
    className={cn(
      "top-[-0.75em] ml-1 text-sm font-medium tracking-normal text-muted-foreground",
      className
    )}
    {...props}
  />
);

const PanelDescription = ({
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div
    data-slot="panel-description"
    className={cn(
      "py-4 text-base text-balance text-muted-foreground",
      className
    )}
    {...props}
  />
);

const PanelContent = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div data-slot="panel-body" className={cn("p-4", className)} {...props} />
);

export {
  Panel,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle,
  PanelTitleSup,
  PanelVisuallyHiddenHeader,
};
