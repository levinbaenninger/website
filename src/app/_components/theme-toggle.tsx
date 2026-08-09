"use client";

import { formatForDisplay, useHotkey } from "@tanstack/react-hotkeys";
import { useTheme } from "next-themes";

import { clickSoftSound } from "@/shared/audio/sounds/click-soft";
import { useSound } from "@/shared/audio/use-sound";
import { Button } from "@/shared/ui/button";
import { MoonIcon } from "@/shared/ui/icons/moon-icon";
import { SunIcon } from "@/shared/ui/icons/sun-icon";
import { Kbd } from "@/shared/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

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
