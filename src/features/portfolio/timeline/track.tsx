import type { ReactNode } from "react";

export const TimelineTrack = ({ children }: { children: ReactNode }) => (
  <div className="relative flex flex-col gap-4 before:absolute before:top-0 before:bottom-0 before:left-3 before:w-px before:bg-border">
    {children}
  </div>
);
