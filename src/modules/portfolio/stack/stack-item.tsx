import type { TechStackItem as TechStackItemData } from "./data";

export const StackItem = ({ href, icon, title }: TechStackItemData) => (
  <li className="flex">
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-6 items-center justify-center gap-1.5 rounded-full bg-muted/50 px-2 font-mono text-xs text-foreground inset-ring-1 inset-ring-border transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0"
    >
      {icon}
      {title}
    </a>
  </li>
);
