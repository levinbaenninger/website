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
    expect(screen.getByRole("tabpanel", { name: "JavaScript" }).hidden).toBe(
      false
    );
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
});
