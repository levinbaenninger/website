import Link from "next/link";

import { PRIMARY_NAVIGATION_ITEMS } from "@/app/_shell/navigation/items";
import { Button } from "@/shared/ui/button";

export const HeaderNavigation = () => (
  <nav aria-label="Primary" className="hidden items-center md:flex">
    {PRIMARY_NAVIGATION_ITEMS.map((item) => (
      <Button key={item.href} variant="link" asChild>
        <Link href={item.href}>{item.title}</Link>
      </Button>
    ))}
  </nav>
);
