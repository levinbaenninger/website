import { cn } from "@/shared/ui/cn";

export const PortfolioSection = ({
  className,
  ...props
}: React.ComponentProps<"section">) => (
  <section
    className={cn(
      "screen-line-top screen-line-bottom mx-auto w-full border-x p-4 md:w-3xl",
      className
    )}
    {...props}
  />
);
