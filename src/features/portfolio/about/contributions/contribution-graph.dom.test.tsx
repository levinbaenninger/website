import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vite-plus/test";

import {
  ContributionGraph,
  ContributionGraphTotalCount,
} from "./contribution-graph";

afterEach(() => {
  cleanup();
});

test("labels a contribution total with its cross-year range", () => {
  const { container } = render(
    <ContributionGraph
      data={[
        { count: 1, date: "2026-08-22", level: 1 },
        { count: 2, date: "2025-08-22", level: 2 },
      ]}
    >
      <ContributionGraphTotalCount />
    </ContributionGraph>
  );

  screen.getByText("3 activities from Aug 22, 2025 to Aug 22, 2026");
  expect(container.textContent).toBe(
    "3 activities from Aug 22, 2025 to Aug 22, 2026"
  );
});

test("labels a contribution total with its single calendar year", () => {
  const { container } = render(
    <ContributionGraph
      data={[
        { count: 1, date: "2026-01-01", level: 1 },
        { count: 2, date: "2026-08-22", level: 2 },
      ]}
    >
      <ContributionGraphTotalCount />
    </ContributionGraph>
  );

  screen.getByText("3 activities in 2026");
  expect(container.textContent).toBe("3 activities in 2026");
});
