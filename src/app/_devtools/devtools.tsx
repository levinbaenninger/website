"use client";

import { TanStackDevtools } from "@tanstack/react-devtools";
import { hotkeysDevtoolsPlugin } from "@tanstack/react-hotkeys-devtools";

export const DevTools = () => (
  <TanStackDevtools plugins={[hotkeysDevtoolsPlugin()]} />
);
