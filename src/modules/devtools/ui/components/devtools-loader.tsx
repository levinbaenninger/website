"use client";

import dynamic from "next/dynamic";

const DevTools =
  process.env.NODE_ENV === "development"
    ? dynamic(
        async () => {
          const devTools =
            await import("@/modules/devtools/ui/components/devtools");
          return devTools.DevTools;
        },
        { ssr: false }
      )
    : () => null;

export const DevToolsLoader = () => <DevTools />;
