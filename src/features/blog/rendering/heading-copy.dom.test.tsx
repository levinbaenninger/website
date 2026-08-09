import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";

import { ArticleCanonicalUrlProvider } from "./canonical-url";
import { ArticleHeading2 } from "./components";

// The shared CopyButton plays a feedback sound inside the click gesture, and
// Happy DOM has no Web Audio implementation to play it through.
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

const CANONICAL_URL = "https://levin.baenninger.me/blog/representative-article";

const renderHeading = (canonicalUrl: string | null) => {
  const writeText = vi.fn();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });

  render(
    <ArticleCanonicalUrlProvider canonicalUrl={canonicalUrl}>
      <ArticleHeading2 id="the-second-section">
        The second section
      </ArticleHeading2>
    </ArticleCanonicalUrlProvider>
  );

  return { writeText };
};

describe("Article heading section links", () => {
  afterEach(() => {
    cleanup();
    Reflect.deleteProperty(navigator, "clipboard");
  });

  test("links the heading text to its own fragment", () => {
    renderHeading(CANONICAL_URL);

    expect(
      screen.getByRole("link", { name: "The second section" })
    ).toHaveProperty("hash", "#the-second-section");
  });

  test("copies the canonical section URL rather than the current location", async () => {
    const { writeText } = renderHeading(CANONICAL_URL);

    await userEvent.click(
      screen.getByRole("button", { name: "Copy link to section" })
    );

    expect(writeText).toHaveBeenCalledWith(
      `${CANONICAL_URL}#the-second-section`
    );
  });

  test("withholds the public copy action from a local Draft", () => {
    renderHeading(null);

    expect(screen.queryByRole("button")).toBeNull();
    expect(
      screen.getByRole("link", { name: "The second section" })
    ).toBeTruthy();
  });
});
