import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, expect, test, vi } from "vite-plus/test";

import { TooltipProvider } from "@/shared/ui/tooltip";

import { CommandMenu } from "./command-menu";

vi.mock(import("next/navigation"), async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => ({
    back: () => {},
    bfcacheId: "test",
    forward: () => {},
    prefetch: () => {},
    push: () => {},
    refresh: () => {},
    replace: () => {},
  }),
}));

const renderCommandMenu = () => (
  <TooltipProvider>
    <CommandMenu />
  </TooltipProvider>
);

const setPlatform = (platform: string) => {
  Object.defineProperty(navigator, "platform", {
    configurable: true,
    value: platform,
  });
};

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

test("hydrates the platform-specific modifier label", async () => {
  setPlatform("Linux x86_64");
  const markup = renderToString(renderCommandMenu());

  expect(markup).toContain(">Ctrl<");

  setPlatform("MacIntel");
  const container = document.createElement("div");
  container.innerHTML = markup;
  document.body.append(container);
  const recoverableErrors: unknown[] = [];

  const root = hydrateRoot(container, renderCommandMenu(), {
    onRecoverableError: (error) => {
      recoverableErrors.push(error);
    },
  });

  await act(async () => {
    await Promise.resolve();
  });

  expect(recoverableErrors).toStrictEqual([]);
  expect(container.textContent).toContain("⌘");

  act(() => {
    root.unmount();
  });
});
