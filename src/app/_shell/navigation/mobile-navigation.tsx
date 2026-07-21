"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Popover } from "radix-ui";
import { useState } from "react";

import { APP_DESTINATIONS } from "@/app/_shell/navigation/destinations";
import { Button } from "@/shared/ui/button";

export const MobileNavigation = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Toggle navigation"
          className="group relative touch-manipulation border-none before:absolute before:-inset-x-2 before:-top-8 before:-bottom-1 active:translate-y-0"
        >
          <span className="absolute h-0.5 w-4 -translate-y-0.75 rounded-full bg-foreground transition-transform group-aria-expanded:translate-y-0 group-aria-expanded:rotate-45" />
          <span className="absolute h-0.5 w-4 translate-y-0.75 rounded-full bg-foreground transition-transform group-aria-expanded:translate-y-0 group-aria-expanded:-rotate-45" />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="center"
          sideOffset={8}
          className="z-50 w-48 rounded-xl bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-border outline-none"
        >
          <nav aria-label="Mobile primary" className="flex flex-col">
            {APP_DESTINATIONS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className="rounded-lg px-3 py-1.5 text-base hover:bg-accent aria-[current=page]:bg-accent"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
