"use client";

import {
  formatForDisplay,
  useHotkey,
  useHotkeySequences,
} from "@tanstack/react-hotkeys";
import { MonitorIcon, MoonIcon, SearchIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactElement } from "react";

import { APP_DESTINATIONS } from "@/app/_shell/navigation/destinations";
import type { AppDestination } from "@/app/_shell/navigation/destinations";
import { PORTFOLIO_DESTINATIONS, SOCIAL_PROFILES } from "@/modules/portfolio";
import { Button } from "@/shared/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/shared/ui/command";
import { Kbd, KbdGroup } from "@/shared/ui/kbd";

interface CommandItemConfig {
  title: string;
  icon: ReactElement;
  shortcut?: string;
  onSelect: () => void;
}

interface ThemeCommandItem {
  title: string;
  icon: ReactElement;
  value: string;
}

interface NavigationCommandSource {
  title: string;
  href: string;
  icon: ReactElement;
  shortcut?: AppDestination["shortcut"];
}

const THEME_COMMAND_ITEMS: ThemeCommandItem[] = [
  {
    title: "Light",
    icon: <SunIcon />,
    value: "light",
  },
  {
    title: "Dark",
    icon: <MoonIcon />,
    value: "dark",
  },
  {
    title: "System",
    icon: <MonitorIcon />,
    value: "system",
  },
];

const CommandMenuItem = ({
  icon,
  onSelect,
  shortcut,
  title,
}: CommandItemConfig) => (
  <CommandItem onSelect={onSelect}>
    {icon}
    <span>{title}</span>
    {shortcut !== undefined && shortcut !== "" ? (
      <CommandShortcut>{shortcut}</CommandShortcut>
    ) : null}
  </CommandItem>
);

const CommandMenuGroup = ({
  heading,
  items,
}: {
  heading: string;
  items: CommandItemConfig[];
}) => (
  <CommandGroup heading={heading}>
    {items.map((item) => (
      <CommandMenuItem key={item.title} {...item} />
    ))}
  </CommandGroup>
);

export const CommandMenu = () => {
  const router = useRouter();
  const { setTheme } = useTheme();

  const [open, setOpen] = useState(false);

  useHotkey("Mod+K", () => {
    setOpen(true);
  });

  const selectAndClose = (select: () => void) => {
    select();
    setOpen(false);
  };

  const createNavigationCommand = ({
    href,
    shortcut,
    ...item
  }: NavigationCommandSource): CommandItemConfig => ({
    ...item,
    shortcut: shortcut?.join(""),
    onSelect: () => {
      selectAndClose(() => {
        router.push(href);
      });
    },
  });

  const createExternalCommand = ({
    href,
    ...item
  }: (typeof SOCIAL_PROFILES)[number]): CommandItemConfig => ({
    ...item,
    onSelect: () => {
      selectAndClose(() => {
        window.open(href, "_blank", "noopener,noreferrer");
      });
    },
  });

  const createThemeCommand = ({
    value,
    ...item
  }: ThemeCommandItem): CommandItemConfig => ({
    ...item,
    onSelect: () => {
      selectAndClose(() => {
        setTheme(value);
      });
    },
  });

  const commandGroups = [
    {
      heading: "Pages",
      items: APP_DESTINATIONS.map(createNavigationCommand),
    },
    {
      heading: "Portfolio",
      items: PORTFOLIO_DESTINATIONS.map(createNavigationCommand),
    },
    {
      heading: "Social profiles",
      items: SOCIAL_PROFILES.map(createExternalCommand),
    },
    {
      heading: "Appearance",
      items: THEME_COMMAND_ITEMS.map(createThemeCommand),
    },
  ];

  useHotkeySequences(
    APP_DESTINATIONS.flatMap((destination) =>
      destination.shortcut
        ? [
            {
              sequence: destination.shortcut,
              callback: () => {
                router.push(destination.href);
                setOpen(false);
              },
            },
          ]
        : []
    )
  );

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => {
          setOpen(true);
        }}
      >
        <SearchIcon data-icon="inline-start" />

        <span className="md:hidden">Search…</span>
        <KbdGroup className="hidden md:inline-flex">
          <Kbd>{formatForDisplay("mod")}</Kbd>
          <Kbd>{formatForDisplay("k")}</Kbd>
        </KbdGroup>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>Nothing found.</CommandEmpty>
            {commandGroups.map((group) => (
              <CommandMenuGroup key={group.heading} {...group} />
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
};
