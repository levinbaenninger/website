// PROTOTYPE — throwaway. Delete this directory once issue #33 is decided.
//
// "Focus" is the one toolbar action the reference does not have — its fourth
// slot is `copy-page`, which is a docs affordance, not a reading one. This is
// the state behind the two candidate meanings of the word.

"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import { useState } from "react";

import type { FocusMode } from "./params";

/**
 * Whether the chrome is currently receded, and how. `null` means the reader is
 * in its normal state; the value is the strategy the `focus` axis selected.
 */
export const useFocusMode = (mode: FocusMode) => {
  const [engaged, setEngaged] = useState(false);

  useHotkey("Escape", () => {
    setEngaged(false);
  });

  const available = mode !== "off";
  const active = engaged && mode !== "off";

  return {
    available,
    chrome: active ? mode : undefined,
    engaged: active,
    label: mode === "hide" ? "Hide chrome" : "Dim chrome",
    toggle: () => {
      setEngaged((current) => !current);
    },
  } as const;
};
