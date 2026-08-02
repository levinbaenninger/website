import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";

import { AppShell } from "@/app/_shell";
import { BlogView } from "@/modules/blog";
import { TooltipProvider } from "@/shared/ui/tooltip";

vi.mock(import("next/navigation"), async (importOriginal) => ({
  ...(await importOriginal()),
  usePathname: () => "/blog",
  useRouter: () => ({
    back: () => {
      // Navigation is outside this shell-rendering seam.
    },
    bfcacheId: "test",
    forward: () => {
      // Navigation is outside this shell-rendering seam.
    },
    prefetch: () => {
      // Navigation is outside this shell-rendering seam.
    },
    push: () => {
      // Navigation is outside this shell-rendering seam.
    },
    refresh: () => {
      // Navigation is outside this shell-rendering seam.
    },
    replace: () => {
      // Navigation is outside this shell-rendering seam.
    },
  }),
}));

const renderShell = (children: React.ReactNode) =>
  render(
    <TooltipProvider>
      <AppShell>{children}</AppShell>
    </TooltipProvider>
  );

describe("App shell accessibility", () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState(null, "", "/");
  });

  test("lets keyboard visitors skip repeated navigation", async () => {
    const user = userEvent.setup();
    renderShell(<p>Page content</p>);

    const skipLink = screen.getByRole("link", { name: "Skip to content" });
    const main = screen.getByRole("main");

    expect(skipLink).toHaveProperty("hash", "#main-content");
    expect(main).toHaveProperty("id", "main-content");

    await user.tab();

    expect(document.activeElement).toBe(skipLink);

    await user.keyboard("{Enter}");

    expect(window.location.hash).toBe("#main-content");
  });

  test("keeps one page main around the Blog catalog", () => {
    renderShell(<BlogView articles={[]} tags={[]} />);

    expect(screen.getAllByRole("main")).toHaveLength(1);
  });
});
