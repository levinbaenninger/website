import { Loader2Icon } from "lucide-react";

import { cn } from "@/shared/ui/cn";

const Spinner = ({ className, ...props }: React.ComponentProps<"svg">) => (
  <Loader2Icon
    data-slot="spinner"
    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- The spinner must retain its SVG prop API.
    role="status"
    aria-label="Loading"
    className={cn("size-4 animate-spin", className)}
    {...props}
  />
);

export { Spinner };
