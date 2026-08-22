"use client";

import { detectPlatform, formatForDisplay } from "@tanstack/react-hotkeys";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {
  // The browser platform cannot change during a page session.
};
const getServerPlatform = (): ReturnType<typeof detectPlatform> => "linux";

export const useHotkeyLabel = (hotkey: string): string => {
  const platform = useSyncExternalStore(
    subscribe,
    detectPlatform,
    getServerPlatform
  );

  return formatForDisplay(hotkey, { platform });
};
