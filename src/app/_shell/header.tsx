import Link from "next/link";

import { ThemeToggle } from "@/app/_appearance/theme-toggle";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";

import { BrandMark } from "./brand-mark";
import { CommandMenu } from "./command-menu";
import { PRIMARY_NAVIGATION_ITEMS } from "./navigation";

const HeaderNavigation = () => (
  <nav aria-label="Primary" className="flex items-center">
    {PRIMARY_NAVIGATION_ITEMS.map((item) => (
      <Button key={item.href} variant="link" asChild>
        <Link href={item.href}>{item.title}</Link>
      </Button>
    ))}
  </nav>
);

export const Header = () => (
  <header className="flex items-center justify-between sticky mx-auto p-2 md:w-3xl screen-line-bottom border-x">
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
