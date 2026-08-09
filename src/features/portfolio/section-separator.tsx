import { cn } from "@/shared/ui/cn";

export const SectionSeparator = ({ className }: { className?: string }) => (
  <div
    className={cn("stripe-divider h-8 w-full border-x border-line", className)}
  />
);
