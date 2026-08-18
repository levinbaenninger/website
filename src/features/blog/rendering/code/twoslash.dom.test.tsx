import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vite-plus/test";

import {
  ArticleTwoslashHover,
  ArticleTwoslashPopup,
  ArticleTwoslashScope,
  ArticleTwoslashTrigger,
} from "./twoslash";

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

    await expect(screen.findByText("greeting: string")).resolves.toBeDefined();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(trigger);
  });

  test("pins on click and stays open once the pointer leaves", async () => {
    const user = userEvent.setup();
    render(<CodeBlock signatures={["greeting: string"]} />);
    const trigger = screen.getByRole("button", { name: "greeting" });

    await user.click(trigger);
    await screen.findByText("greeting: string");
    await user.unhover(trigger);

    // Don't use Radix Trigger: clicking a previewing token would toggle close.
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

    await expect(screen.findByText("greeting: string")).resolves.toBeDefined();
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

    await waitFor(() => {
      expect(screen.queryByText("greeting: string")).toBeNull();
    });
  });
});
