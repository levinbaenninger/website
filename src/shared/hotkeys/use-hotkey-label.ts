"use client";

import { detectPlatform, formatForDisplay } from "@tanstack/react-hotkeys";
import type {
  DisplayHotkey,
  DisplayHotkeyChord,
} from "@tanstack/react-hotkeys";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {
  // The browser platform cannot change during a page session.
};
const getServerPlatform = (): ReturnType<typeof detectPlatform> => "linux";

const usePlatform = () =>
  useSyncExternalStore(subscribe, detectPlatform, getServerPlatform);

export const useHotkeyLabel = (hotkey: DisplayHotkey): string =>
  formatForDisplay(hotkey, { platform: usePlatform() });

/** One label per key, such as `["⌘", "K"]` for `Mod+K` on macOS. */
export const useHotkeyLabelParts = (hotkey: DisplayHotkeyChord): string[] =>
  formatForDisplay(hotkey, { platform: usePlatform(), parts: true });
