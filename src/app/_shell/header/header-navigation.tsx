import Link from "next/link";

import { APP_DESTINATIONS } from "@/app/_shell/navigation/destinations";
import { Button } from "@/shared/ui/button";

export const HeaderNavigation = () => (
  <nav aria-label="Primary" className="hidden items-center md:flex">
    {APP_DESTINATIONS.map((item) => (
      <Button key={item.href} variant="link" asChild>
        <Link href={item.href}>{item.title}</Link>
      </Button>
    ))}
  </nav>
);
