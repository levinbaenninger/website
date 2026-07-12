"use client";

import dynamic from "next/dynamic";

export const DevTools =
  process.env.NODE_ENV === "development"
    ? dynamic(
        async () => {
          const [{ TanStackDevtools }, { hotkeysDevtoolsPlugin }] =
            await Promise.all([
              import("@tanstack/react-devtools"),
              import("@tanstack/react-hotkeys-devtools"),
            ]);

          return () => <TanStackDevtools plugins={[hotkeysDevtoolsPlugin()]} />;
        },
        { ssr: false }
      )
    : () => null;
