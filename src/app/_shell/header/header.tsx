import Link from "next/link";

import { BrandMark } from "@/app/_shell/branding/brand-mark";
import { CommandMenu } from "@/app/_shell/command-menu/command-menu";
import { HeaderNavigation } from "@/app/_shell/header/header-navigation";
import { ThemeToggle } from "@/app/_theme/theme-toggle";
import { Separator } from "@/shared/ui/separator";

export const Header = () => (
  <header className="screen-line-bottom sticky top-0 z-50 mx-auto flex w-full items-center justify-between border-x border-line bg-background p-2 md:w-3xl">
    <Link href="/" aria-label="Home">
      <BrandMark className="h-8" />
    </Link>
    <div className="flex items-center gap-2">
      <HeaderNavigation />

      <Separator orientation="vertical" />

      <CommandMenu />

      <Separator orientation="vertical" />

      <ThemeToggle />
    </div>
  </header>
);
