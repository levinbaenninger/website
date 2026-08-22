import Link from "next/link";

import { BrandMark } from "@/app/_components/app-shell/branding/brand-mark";
import { CommandMenu } from "@/app/_components/app-shell/command-menu/command-menu";
import { HeaderNavigation } from "@/app/_components/app-shell/header/header-navigation";
import { MobileNavigation } from "@/app/_components/app-shell/navigation/mobile-navigation";
import { ThemeToggle } from "@/app/_components/theme-toggle";
import { Separator } from "@/shared/ui/separator";

/* Bleeds past the shell gutter and re-applies it so `screen-line-*` at `-z-1`
   cannot show through the gutters. */
export const Header = () => (
  <header className="sticky top-0 z-50 -mx-2 bg-background px-2">
    <div className="screen-line-bottom mx-auto flex w-full items-center justify-between border-x border-line p-2 md:w-3xl">
      <Link href="/" aria-label="Home">
        <BrandMark className="h-8" />
      </Link>
      <div className="flex items-center gap-2">
        <HeaderNavigation />

        <Separator
          orientation="vertical"
          className="hidden md:block data-vertical:h-4 data-vertical:self-center"
        />

        {/* `bottom`, not `top: 100svh - x`: `svh` is static and will not track
            a mobile URL bar. */}
        <div className="fixed bottom-safe-4 left-1/2 z-50 flex w-fit -translate-x-1/2 items-center rounded-xl bg-popover py-1 pr-1 pl-2.5 shadow-md ring-1 ring-border md:static md:translate-x-0 md:bg-transparent md:p-0 md:shadow-none md:ring-0">
          <CommandMenu />
          <Separator
            orientation="vertical"
            className="mx-1.5 md:hidden data-vertical:h-4 data-vertical:self-center"
          />
          <div className="flex md:hidden">
            <MobileNavigation />
          </div>
        </div>

        <Separator
          orientation="vertical"
          className="hidden md:block data-vertical:h-4 data-vertical:self-center"
        />

        <ThemeToggle />
      </div>
    </div>
  </header>
);
