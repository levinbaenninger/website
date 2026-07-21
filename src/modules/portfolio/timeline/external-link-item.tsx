import { ArrowUpRightIcon } from "lucide-react";
import type { ReactNode } from "react";

export const TimelineExternalLinkItem = ({
  children,
  heading,
  href,
  icon,
}: {
  children: ReactNode;
  heading: ReactNode;
  href: string;
  icon: ReactNode;
}) => (
  <a
    className="group/timeline-item relative block outline-none before:absolute before:-inset-y-1 before:-right-1 before:left-7 before:-z-1 before:rounded-lg before:transition-colors hover:before:bg-accent focus-visible:before:ring-2 focus-visible:before:ring-ring/50"
    href={href}
    rel="noreferrer"
    target="_blank"
  >
    <div className="pointer-events-none absolute bottom-0 left-3 hidden size-4 bg-background group-last/timeline-item:flex">
      <span className="size-full -translate-y-2.25 rounded-bl-sm border-b border-l" />
    </div>

    <div className="relative z-1 mb-1 flex items-start gap-3 text-base">
      <div className="flex size-6 shrink-0 items-center justify-center rounded-md border border-muted-foreground/15 bg-muted text-muted-foreground ring-1 ring-line ring-offset-1 ring-offset-background [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
        {icon}
      </div>

      <div className="min-w-0 flex-1">{heading}</div>

      <ArrowUpRightIcon
        aria-hidden
        className="size-4 shrink-0 text-muted-foreground"
      />
    </div>

    {children}
  </a>
);
