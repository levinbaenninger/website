import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vite-plus/test";

import { TimelineItem } from "./item";
import { TimelineList } from "./list";

const paragraphText = () =>
  screen.queryAllByRole("paragraph").map(({ textContent }) => textContent);

afterEach(() => {
  cleanup();
});

describe("Portfolio timeline", () => {
  test("reveals and hides additional items", async () => {
    const user = userEvent.setup();
    render(
      <TimelineList max={2}>
        <p>First item</p>
        <p>Second item</p>
        <p>Third item</p>
      </TimelineList>
    );

    expect(paragraphText()).toStrictEqual(["First item", "Second item"]);

    const trigger = screen.getByRole("button", { name: /show more/iu });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    await user.click(trigger);

    expect(paragraphText()).toStrictEqual([
      "First item",
      "Second item",
      "Third item",
    ]);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    await user.click(trigger);

    expect(paragraphText()).toStrictEqual(["First item", "Second item"]);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  test("omits the list trigger when every item fits", () => {
    render(
      <TimelineList max={2}>
        <p>First item</p>
        <p>Second item</p>
      </TimelineList>
    );

    expect(paragraphText()).toStrictEqual(["First item", "Second item"]);
    expect(screen.queryByRole("button")).toBeNull();
  });

  test("reveals a timeline description from its accessible trigger", async () => {
    const user = userEvent.setup();
    render(
      <TimelineItem
        description="Built visitor-facing features."
        heading={<h3>Portfolio project</h3>}
        icon={<span aria-hidden>Icon</span>}
      >
        <span>2026</span>
      </TimelineItem>
    );

    const trigger = screen.getByRole("button", {
      name: /portfolio project/iu,
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(paragraphText()).toStrictEqual([]);

    await user.click(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(paragraphText()).toStrictEqual(["Built visitor-facing features."]);
  });
});
