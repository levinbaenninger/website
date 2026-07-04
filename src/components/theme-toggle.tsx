"use client";

import { formatForDisplay, useHotkey } from "@tanstack/react-hotkeys";
import { useTheme } from "next-themes";

import { useSound } from "@/sounds/hooks/use-sound";
import { clickSoftSound } from "@/sounds/sounds/click-soft";

import { MoonIcon } from "./icons/moon";
import { SunIcon } from "./icons/sun";
import { Button } from "./ui/button";
import { Kbd } from "./ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();

  const [click] = useSound(clickSoftSound, { volume: 0.3 });

  const switchTheme = () => {
    click();
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const hotkey = "D";

  useHotkey(hotkey, () => {
    switchTheme();
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="touch-manipulation not-pointer-fine:hit-area-2"
          variant="ghost"
          size="icon-sm"
          aria-label="Toggle Mode"
          onClick={() => {
            switchTheme();
          }}
        >
          <MoonIcon className="hidden [html.dark_&]:block" aria-hidden />
          <SunIcon className="hidden [html.light_&]:block" aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Toggle Mode <Kbd>{formatForDisplay(hotkey)}</Kbd>
      </TooltipContent>
    </Tooltip>
  );
};
