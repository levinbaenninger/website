import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vite-plus/test";

import { getContributions } from "./get-contributions";

const fetchMock = vi.fn<typeof fetch>();
const originalApiUrl = process.env.GITHUB_CONTRIBUTIONS_API_URL;

const activity = {
  count: 3,
  date: "2026-07-30",
  level: 2,
};

const responseWith = (body: unknown, status = 200) =>
  Response.json(body, { status });

describe("GitHub contributions", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    delete process.env.GITHUB_CONTRIBUTIONS_API_URL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();

    if (originalApiUrl === undefined) {
      delete process.env.GITHUB_CONTRIBUTIONS_API_URL;
    } else {
      process.env.GITHUB_CONTRIBUTIONS_API_URL = originalApiUrl;
    }
  });

  test("returns validated contributions", async () => {
    fetchMock.mockResolvedValue(responseWith({ contributions: [activity] }));

    await expect(getContributions("levinbaenninger")).resolves.toStrictEqual({
      contributions: [activity],
      status: "success",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://github-contributions-api.jogruber.de/v4/levinbaenninger?y=last"
    );
  });

  test("reports an unsuccessful response as unavailable", async () => {
    fetchMock.mockResolvedValue(responseWith({ message: "Unavailable" }, 503));

    await expect(getContributions("levinbaenninger")).resolves.toStrictEqual({
      status: "unavailable",
    });
  });

  test("reports a rejected request as unavailable", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network unavailable"));

    await expect(getContributions("levinbaenninger")).resolves.toStrictEqual({
      status: "unavailable",
    });
  });

  test.each([
    ["an impossible date", { ...activity, date: "2026-02-30" }],
    ["a negative count", { ...activity, count: -1 }],
    ["a fractional count", { ...activity, count: 1.5 }],
    ["a level above four", { ...activity, level: 5 }],
  ])("rejects %s", async (_case, invalidActivity) => {
    fetchMock.mockResolvedValue(
      responseWith({ contributions: [invalidActivity] })
    );

    await expect(getContributions("levinbaenninger")).resolves.toStrictEqual({
      status: "unavailable",
    });
  });

  test("accepts count and level boundaries", async () => {
    const boundaryActivities = [
      { ...activity, count: 0, level: 0 },
      { ...activity, date: "2026-07-31", level: 4 },
    ];
    fetchMock.mockResolvedValue(
      responseWith({ contributions: boundaryActivities })
    );

    await expect(getContributions("levinbaenninger")).resolves.toStrictEqual({
      contributions: boundaryActivities,
      status: "success",
    });
  });

  test("accepts an empty contribution history", async () => {
    fetchMock.mockResolvedValue(responseWith({ contributions: [] }));

    await expect(getContributions("levinbaenninger")).resolves.toStrictEqual({
      contributions: [],
      status: "success",
    });
  });

  test("rejects a malformed response", async () => {
    fetchMock.mockResolvedValue(responseWith({ activity: [activity] }));

    await expect(getContributions("levinbaenninger")).resolves.toStrictEqual({
      status: "unavailable",
    });
  });
});
