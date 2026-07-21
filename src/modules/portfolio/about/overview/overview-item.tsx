import { cn } from "@/shared/ui/cn";

export const OverviewItem = ({
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div
    className={cn("flex items-center gap-4 font-mono text-sm", className)}
    {...props}
  />
);

export const OverviewItemIcon = ({
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div
    className={cn(
      "flex size-6 shrink-0 items-center justify-center rounded-md border border-muted-foreground/15 bg-muted ring-1 ring-line ring-offset-1 ring-offset-background",
      "[&_svg]:pointer-events-none [&_svg]:text-muted-foreground [&_svg:not([class*='size-'])]:size-4",
      className
    )}
    {...props}
  />
);

export const OverviewItemContent = ({
  className,
  ...props
}: React.ComponentProps<"p">) => (
  <p className={cn("text-balance", className)} {...props} />
);

export const OverviewItemLink = ({
  children,
  className,
  ...props
}: React.ComponentProps<"a">) => (
  <a
    className={cn("decoration-1 underline-offset-3 hover:underline", className)}
    target="_blank"
    rel="noopener"
    {...props}
  >
    {children}
  </a>
);
