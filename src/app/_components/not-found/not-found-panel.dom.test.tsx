import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vite-plus/test";

import { NotFoundPanel } from "@/app/_components/not-found/not-found-panel";

const linkNames = () =>
  screen.getAllByRole("link").map((link) => link.textContent);

describe("Not found recovery", () => {
  afterEach(() => {
    cleanup();
  });

  test("names the failure without relying on the numeral", () => {
    render(<NotFoundPanel path="/nope" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Page not found" })
    ).toBeTruthy();
  });

  test("names an unpublished Article when the address was an Article", () => {
    render(<NotFoundPanel path="/blog/never-written" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Article not found" })
    ).toBeTruthy();
  });

  test("offers Portfolio and Blog as recovery links", () => {
    render(<NotFoundPanel path="/nope" />);

    expect(screen.getByRole("link", { name: "Portfolio" })).toHaveProperty(
      "pathname",
      "/"
    );
    expect(screen.getByRole("link", { name: "Blog" })).toHaveProperty(
      "pathname",
      "/blog"
    );
  });

  test("leads with Blog when the visitor came from an Article address", () => {
    render(<NotFoundPanel path="/blog/never-written" />);

    expect(linkNames()).toStrictEqual(["Blog", "Portfolio"]);
  });

  test("leads with Portfolio anywhere else", () => {
    render(<NotFoundPanel path="/nope" />);

    expect(linkNames()).toStrictEqual(["Portfolio", "Blog"]);
  });

  test("reports the visited address once it is known", () => {
    render(<NotFoundPanel path="/blog/never-written" />);

    expect(screen.getByText("/blog/never-written")).toBeTruthy();
  });

  test("withholds the address until the visited path resolves", () => {
    render(<NotFoundPanel path={null} />);

    expect(screen.queryByText("/nope")).toBeNull();
    expect(screen.getByText("—")).toBeTruthy();
  });

  test("exposes replotting the figure as a button", () => {
    render(<NotFoundPanel path="/nope" />);

    expect(screen.getByRole("button", { name: /replot/iu })).toBeTruthy();
  });
});
