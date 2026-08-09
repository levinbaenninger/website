import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";

import { AppShell } from "@/app/_shell";
import { BlogView } from "@/features/blog/catalog/view";
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

  test("opens the Blog catalog on its own heading", () => {
    renderShell(<BlogView articles={[]} tags={[]} />);

    const [first] = screen.getAllByRole("heading");

    // Closed overlays contribute nothing to the outline, so the first heading
    // a visitor meets is the page's own, not one belonging to the shell.
    expect(first).toHaveProperty("tagName", "H1");
  });

  test("names the command menu only while it is open", async () => {
    const user = userEvent.setup();
    renderShell(<BlogView articles={[]} tags={[]} />);

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText("Command Palette")).toBeNull();

    await user.click(screen.getByRole("button", { name: /search/iu }));

    expect(
      screen.getByRole("dialog", { name: "Command Palette" })
    ).toBeTruthy();
  });
});
