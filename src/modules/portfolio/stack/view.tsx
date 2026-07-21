import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
  PanelTitleCopy,
} from "@/shared/ui/panel";

import { STACK_CATALOG } from "./catalog";
import { STACK_ICONS } from "./icons";

export const StackView = () => (
  <Panel id="stack" className="mx-auto w-full md:w-3xl">
    <PanelHeader>
      <PanelTitle>
        <a href="#stack">Stack</a>
        <PanelTitleCopy id="stack" />
      </PanelTitle>
    </PanelHeader>

    <PanelContent className="p-0">
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-y-0 left-48 -z-1 w-px bg-[linear-gradient(to_bottom,var(--line)_4px,transparent_2px)] bg-size-[1px_6px] bg-repeat-y max-sm:hidden"
          aria-hidden
        />

        {STACK_CATALOG.map((category, index) => (
          <section
            className="grid items-start gap-y-2 border-b border-line py-4 last:border-none sm:grid-cols-[12rem_1fr]"
            key={category.category}
          >
            <h3 className="pl-4 text-sm/6 text-muted-foreground">
              <span
                className="mr-1.5 font-mono text-muted-foreground/50 select-none"
                aria-hidden
              >
                {(index + 1).toString().padStart(2, "0")}
              </span>
              {category.category}
            </h3>

            <ul className="flex flex-wrap gap-1.5 px-4">
              {category.items.map((item) => (
                <li className="flex" key={item.title}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-6 items-center justify-center gap-1.5 rounded-full bg-muted/50 px-2 font-mono text-xs text-foreground inset-ring-1 inset-ring-border transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0"
                  >
                    {STACK_ICONS[item.icon]}
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PanelContent>
  </Panel>
);
