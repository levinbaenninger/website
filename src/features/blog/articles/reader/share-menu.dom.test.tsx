import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vite-plus/test";

import { ArticleShareMenu } from "./share-menu";

const { reducedMotion } = vi.hoisted(() => ({
  reducedMotion: { current: false },
}));

// The menu plays the shared click-soft tick inside the click gesture, and Happy
// DOM has no Web Audio implementation to play it through.
vi.mock(import("@/shared/audio/use-sound"), () => ({
  useSound: () =>
    [
      () => {},
      {
        duration: null,
        isPlaying: false,
        pause: () => {},
        sound: { dataUri: "", duration: 0 },
        stop: () => {},
      },
    ] as never,
}));

vi.mock(import("motion/react"), async (importOriginal) => ({
  ...(await importOriginal()),
  useReducedMotion: () => reducedMotion.current,
}));

const CANONICAL_URL = "https://levin.baenninger.me/blog/representative-article";
const TITLE = "Representative Article";

const replaceOnNavigator = (key: string, value: unknown) => {
  Object.defineProperty(navigator, key, { configurable: true, value });
};

/** The clipboard a browser hands a page that has permission to write to it. */
const grantClipboard = () => {
  const writeText = vi.fn<(text: string) => Promise<void>>(async () => {});
  replaceOnNavigator("clipboard", { writeText });
  return writeText;
};

/**
 * A browser API that refuses.
 *
 * A synchronous throw, as elsewhere in this suite: the caller awaits the result
 * inside a `try`, where a throw and a rejection are the same event.
 */
const denied = (error: Error) =>
  vi.fn(() => {
    throw error;
  });

/** The rejection a browser produces when the reader dismissed the sheet. */
const abort = () =>
  Object.assign(new Error("Share canceled"), { name: "AbortError" });

const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "Share" }));
  return await screen.findByRole("menu");
};

beforeEach(() => {
  reducedMotion.current = false;
  grantClipboard();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  for (const key of ["clipboard", "share", "vibrate"]) {
    Reflect.deleteProperty(navigator, key);
  }
});

const renderMenu = () =>
  render(<ArticleShareMenu canonicalUrl={CANONICAL_URL} title={TITLE} />);

describe("Article Share menu", () => {
  test("shares the canonical Article URL it was given, not the browser's", async () => {
    const user = userEvent.setup();
    const writeText = grantClipboard();
    // A location the menu must not reach for: the same Article, but a preview
    // origin carrying a fragment and an incidental query parameter.
    window.history.replaceState(
      null,
      "",
      "/blog/representative-article?utm_source=newsletter#a-section"
    );
    renderMenu();

    await openMenu(user);
    const x = screen.getByRole("menuitem", { name: "Share on X" });
    const linkedIn = screen.getByRole("menuitem", {
      name: "Share on LinkedIn",
    });

    expect(x.getAttribute("href")).toBe(
      `https://x.com/intent/tweet?text=${encodeURIComponent(TITLE)}&url=${encodeURIComponent(CANONICAL_URL)}`
    );
    // LinkedIn's feed share intent prefills the composer with title and URL;
    // share-offsite only accepts a URL and often opens empty.
    expect(linkedIn.getAttribute("href")).toBe(
      `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(`${TITLE} ${CANONICAL_URL}`)}`
    );

    await user.click(screen.getByRole("menuitem", { name: "Copy link" }));

    expect(writeText).toHaveBeenCalledWith(CANONICAL_URL);
  });

  test("keeps the menu open on a successful copy and says so", async () => {
    const user = userEvent.setup();
    renderMenu();

    const menu = await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Copy link" }));

    const copied = await screen.findByRole("menuitem", { name: "Copied" });

    expect(menu.isConnected).toBe(true);
    expect(copied).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("Copied");
  });

  test("reports a denied clipboard in place, and recovers", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    replaceOnNavigator("clipboard", {
      writeText: denied(new Error("Write permission denied")),
    });
    renderMenu();

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Copy link" }));

    expect(
      await screen.findByRole("menuitem", { name: "Copy failed" })
    ).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("Copy failed");

    await vi.advanceTimersByTimeAsync(1500);

    expect(
      await screen.findByRole("menuitem", { name: "Copy link" })
    ).toBeTruthy();
  });

  test("offers native sharing only where the platform has it", async () => {
    const user = userEvent.setup();
    renderMenu();

    await openMenu(user);

    expect(
      screen.queryByRole("menuitem", { name: "More sharing options…" })
    ).toBeNull();

    cleanup();
    replaceOnNavigator(
      "share",
      vi.fn(async () => {})
    );
    renderMenu();

    await openMenu(user);

    expect(
      screen.getByRole("menuitem", { name: "More sharing options…" })
    ).toBeTruthy();
  });

  test("hands the native sheet the Article title and its URL", async () => {
    const user = userEvent.setup();
    const share = vi.fn(async () => {});
    replaceOnNavigator("share", share);
    renderMenu();

    await openMenu(user);
    await user.click(
      screen.getByRole("menuitem", { name: "More sharing options…" })
    );

    expect(share).toHaveBeenCalledWith({ title: TITLE, url: CANONICAL_URL });
  });

  test("says nothing when the reader calls the native share off", async () => {
    const user = userEvent.setup();
    replaceOnNavigator("share", denied(abort()));
    renderMenu();

    await openMenu(user);
    await user.click(
      screen.getByRole("menuitem", { name: "More sharing options…" })
    );

    // Cancelling is a decision, not a failure. The menu keeps its own words.
    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toBe("");
    });
    expect(
      screen.getByRole("menuitem", { name: "More sharing options…" })
    ).toBeTruthy();
  });

  test("reports a native share that genuinely failed", async () => {
    const user = userEvent.setup();
    replaceOnNavigator(
      "share",
      denied(
        Object.assign(new Error("Permission denied"), {
          name: "NotAllowedError",
        })
      )
    );
    renderMenu();

    await openMenu(user);
    await user.click(
      screen.getByRole("menuitem", { name: "More sharing options…" })
    );

    expect(
      await screen.findByRole("menuitem", { name: "Sharing failed" })
    ).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("Sharing failed");
  });

  test("opens from the keyboard and gives focus back on Escape", async () => {
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByRole("button", { name: "Share" });
    trigger.focus();
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole("menuitem", { name: "Copy link" })
      );
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("menu")).toBeNull();
    });
    expect(document.activeElement).toBe(trigger);
  });

  test("snaps the copy result into place where motion is unwelcome", async () => {
    const user = userEvent.setup();
    renderMenu();

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Copy link" }));
    await screen.findByRole("menuitem", { name: "Copied" });

    const animated = document.querySelector<HTMLElement>(
      '[data-slot="share-item-icon"]'
    );

    expect(animated?.getAttribute("style")).toBeTruthy();

    cleanup();
    reducedMotion.current = true;
    renderMenu();

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Copy link" }));
    await screen.findByRole("menuitem", { name: "Copied" });

    const snapped = document.querySelector<HTMLElement>(
      '[data-slot="share-item-icon"]'
    );

    expect(snapped?.getAttribute("style")).toBeNull();
  });
});
