import Link from "next/link";

import { BrandMark } from "@/app/_shell/branding/brand-mark";
import { CommandMenu } from "@/app/_shell/command-menu/command-menu";
import { HeaderNavigation } from "@/app/_shell/header/header-navigation";
import { ThemeToggle } from "@/app/_theme/theme-toggle";
import { Separator } from "@/shared/ui/separator";

export const Header = () => (
  <header className="flex items-center justify-between sticky mx-auto p-2 w-full md:w-3xl screen-line-bottom border-x">
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
