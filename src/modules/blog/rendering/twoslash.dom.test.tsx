import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vite-plus/test";

import {
  ArticleTwoslashHover,
  ArticleTwoslashPopup,
  ArticleTwoslashScope,
  ArticleTwoslashTrigger,
} from "./twoslash";

/*
 * The shape `code.ts` compiles: a hover wrapping a popup and a trigger, the
 * whole thing inside one CodeBlock's pin scope. Written out rather than compiled
 * here so the interaction is the only variable; `contract.test.ts` proves the
 * compiler produces exactly this.
 */
const Token = ({ signature }: { readonly signature: string }) => (
  <ArticleTwoslashHover className="twoslash-hover">
    <ArticleTwoslashPopup className="twoslash-popup-container">
      {signature}
    </ArticleTwoslashPopup>
    <ArticleTwoslashTrigger className="twoslash-trigger">
      {signature.split(":")[0]}
    </ArticleTwoslashTrigger>
  </ArticleTwoslashHover>
);

const CodeBlock = ({
  signatures,
}: {
  readonly signatures: readonly string[];
}) => (
  <ArticleTwoslashScope>
    <pre>
      <code>
        {signatures.map((signature) => (
          <Token key={signature} signature={signature} />
        ))}
      </code>
    </pre>
  </ArticleTwoslashScope>
);

afterEach(cleanup);

describe("Twoslash type popovers", () => {
  test("previews on focus without moving the caret", async () => {
    const user = userEvent.setup();
    render(<CodeBlock signatures={["greeting: string"]} />);
    const trigger = screen.getByRole("button", { name: "greeting" });

    await user.tab();

    expect(await screen.findByText("greeting: string")).toBeDefined();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    // A preview is not a destination: focus stays on the token so Escape and
    // ordinary tabbing still work from where the reader is.
    expect(document.activeElement).toBe(trigger);
  });

  test("pins on click and stays open once the pointer leaves", async () => {
    const user = userEvent.setup();
    render(<CodeBlock signatures={["greeting: string"]} />);
    const trigger = screen.getByRole("button", { name: "greeting" });

    await user.click(trigger);
    await screen.findByText("greeting: string");
    await user.unhover(trigger);

    // Clicking a token already previewing under the pointer means "keep this",
    // never "close it" — which is why the trigger is not Radix's own.
    expect(screen.getByText("greeting: string")).toBeDefined();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  test("dismisses a pinned popup with Escape", async () => {
    const user = userEvent.setup();
    render(<CodeBlock signatures={["greeting: string"]} />);
    const trigger = screen.getByRole("button", { name: "greeting" });

    await user.click(trigger);
    await screen.findByText("greeting: string");
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByText("greeting: string")).toBeNull();
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  test("keeps at most one pinned popup per CodeBlock", async () => {
    const user = userEvent.setup();
    render(<CodeBlock signatures={["greeting: string", "answer: number"]} />);

    await user.click(screen.getByRole("button", { name: "greeting" }));
    await screen.findByText("greeting: string");
    await user.click(screen.getByRole("button", { name: "answer" }));
    await screen.findByText("answer: number");

    // A long example must not end under a stack of overlapping cards.
    await waitFor(() => {
      expect(screen.queryByText("greeting: string")).toBeNull();
    });
  });

  test("unpins the token that is already pinned", async () => {
    const user = userEvent.setup();
    render(<CodeBlock signatures={["greeting: string"]} />);
    const trigger = screen.getByRole("button", { name: "greeting" });

    await user.click(trigger);
    await screen.findByText("greeting: string");
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.queryByText("greeting: string")).toBeNull();
    });
  });

  test("pins from a tap, which has no hover to preview with", async () => {
    const user = userEvent.setup();
    render(<CodeBlock signatures={["greeting: string"]} />);

    await user.pointer({
      keys: "[TouchA]",
      target: screen.getByRole("button", { name: "greeting" }),
    });

    expect(await screen.findByText("greeting: string")).toBeDefined();
  });

  test("dismisses a pinned popup when the reader moves on", async () => {
    const user = userEvent.setup();
    render(
      <>
        <CodeBlock signatures={["greeting: string"]} />
        <p>Prose after the example.</p>
      </>
    );

    await user.click(screen.getByRole("button", { name: "greeting" }));
    await screen.findByText("greeting: string");
    await user.click(screen.getByText("Prose after the example."));

    // Reading on is a dismissal. A pinned popup that survives the reader
    // leaving the example is a popup sitting on top of the next paragraph.
    await waitFor(() => {
      expect(screen.queryByText("greeting: string")).toBeNull();
    });
  });
});
