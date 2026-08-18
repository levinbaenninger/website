import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vite-plus/test";

import { ArticleCodeTabs } from "./code-tabs";

const labels = JSON.stringify(["TypeScript", "JavaScript"]);

const CodeTabsFixture = ({ groupId = "runtime" }: { groupId?: string }) => (
  <ArticleCodeTabs groupId={groupId} labels={labels}>
    <p>TypeScript panel</p>
    <p>JavaScript panel</p>
  </ArticleCodeTabs>
);

const denied = () => {
  throw new Error("The operation is insecure.");
};

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("synchronized code tabs", () => {
  test("applies a saved preference after the default render", async () => {
    window.localStorage.setItem("blog:code-tabs:runtime", "JavaScript");

    render(<CodeTabsFixture />);

    await waitFor(() => {
      expect(
        screen
          .getByRole("tab", { name: "JavaScript" })
          .getAttribute("aria-selected")
      ).toBe("true");
    });
    expect(
      screen.getByRole("tabpanel", { name: "JavaScript" }).hidden
    ).toBeFalsy();
  });

  test("synchronizes matching groups and persists the selected label", async () => {
    const user = userEvent.setup();
    render(
      <>
        <CodeTabsFixture />
        <CodeTabsFixture />
      </>
    );
    const [firstTablist] = screen.getAllByRole("tablist", {
      name: "Code examples",
    });

    await user.click(
      within(firstTablist).getByRole("tab", { name: "JavaScript" })
    );

    await waitFor(() => {
      for (const tab of screen.getAllByRole("tab", { name: "JavaScript" })) {
        expect(tab.getAttribute("aria-selected")).toBe("true");
      }
    });
    expect(window.localStorage.getItem("blog:code-tabs:runtime")).toBe(
      "JavaScript"
    );
  });

  test("leaves focus alone in a group it did not act on", async () => {
    const user = userEvent.setup();
    render(
      <>
        <CodeTabsFixture />
        <CodeTabsFixture />
      </>
    );
    const [firstTablist, secondTablist] = screen.getAllByRole("tablist", {
      name: "Code examples",
    });
    const clicked = within(firstTablist).getByRole("tab", {
      name: "JavaScript",
    });

    await user.click(clicked);

    await waitFor(() => {
      expect(
        within(secondTablist)
          .getByRole("tab", { name: "JavaScript" })
          .getAttribute("aria-selected")
      ).toBe("true");
    });
    expect(document.activeElement).toBe(clicked);
  });

  test("keeps ungrouped tabs independent of one another", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ArticleCodeTabs labels={labels}>
          <p>First TypeScript</p>
          <p>First JavaScript</p>
        </ArticleCodeTabs>
        <ArticleCodeTabs labels={labels}>
          <p>Second TypeScript</p>
          <p>Second JavaScript</p>
        </ArticleCodeTabs>
      </>
    );
    const [firstTablist, secondTablist] = screen.getAllByRole("tablist", {
      name: "Code examples",
    });

    await user.click(
      within(firstTablist).getByRole("tab", { name: "JavaScript" })
    );

    await waitFor(() => {
      expect(
        within(firstTablist)
          .getByRole("tab", { name: "JavaScript" })
          .getAttribute("aria-selected")
      ).toBe("true");
    });
    expect(
      within(secondTablist)
        .getByRole("tab", { name: "TypeScript" })
        .getAttribute("aria-selected")
    ).toBe("true");
    expect(window.localStorage).toHaveLength(0);
  });

  test("moves between tabs with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<CodeTabsFixture />);

    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("tab", { name: "TypeScript" })
    );

    await user.keyboard("{ArrowRight}");

    await waitFor(() => {
      expect(
        screen
          .getByRole("tab", { name: "JavaScript" })
          .getAttribute("aria-selected")
      ).toBe("true");
    });
    expect(
      screen.getByRole("tabpanel", { name: "JavaScript" }).hidden
    ).toBeFalsy();
  });

  test("keeps working when storage is denied", async () => {
    const user = userEvent.setup();
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    if (original === undefined) {
      throw new TypeError("Expected a localStorage descriptor to restore.");
    }
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: denied, setItem: denied },
    });

    try {
      render(<CodeTabsFixture />);
      await user.click(screen.getByRole("tab", { name: "JavaScript" }));

      await waitFor(() => {
        expect(
          screen
            .getByRole("tab", { name: "JavaScript" })
            .getAttribute("aria-selected")
        ).toBe("true");
      });
      expect(
        screen.getByRole("tabpanel", { name: "JavaScript" }).hidden
      ).toBeFalsy();
    } finally {
      Object.defineProperty(window, "localStorage", original);
    }
  });

  test("keeps an unopened tab findable by the browser", () => {
    render(<CodeTabsFixture />);

    const inactive = screen.getByText("JavaScript panel").parentElement;
    // `until-found` is what lets find-in-page reveal a match the reader has not
    // opened; a plain `hidden` would make the text unreachable.
    expect(inactive?.getAttribute("hidden")).toBe("until-found");
    expect(inactive?.getAttribute("role")).toBe("tabpanel");
  });
});
