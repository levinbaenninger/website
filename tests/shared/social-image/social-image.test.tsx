import { readFile, writeFile } from "node:fs/promises";

import sharp from "sharp";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";

import {
  SOCIAL_IMAGE_CONTENT_TYPE,
  SOCIAL_IMAGE_SIZE,
  renderSocialImage,
} from "@/shared/social-image";
import type { SocialImageInput } from "@/shared/social-image";

const PORTFOLIO_INPUT = {
  alt: "Levin Bänninger — Portfolio",
  label: "Portfolio",
  title: "Levin Bänninger",
} as const satisfies SocialImageInput;

const BLOG_INPUT = {
  alt: "Levin Bänninger — Blog",
  label: "Blog",
  title: "Levin Bänninger’s Blog",
} as const satisfies SocialImageInput;

const ARTICLE_INPUT = {
  alt: "Understanding Cache Components — Levin Bänninger",
  label: "Article",
  title: "Understanding Cache Components",
} as const satisfies SocialImageInput;

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const toFetchUrl = (input: string | URL | Request): string => {
  if (input instanceof Request) {
    return input.url;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input;
};

const toBytes = async (input: SocialImageInput): Promise<Buffer> => {
  const response = renderSocialImage(input);
  expect(response.headers.get("content-type")).toBe(SOCIAL_IMAGE_CONTENT_TYPE);
  return Buffer.from(await response.arrayBuffer());
};

const countTitleLineGroups = async (bytes: Buffer): Promise<number> => {
  const { data, info } = await sharp(bytes)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const inkRows: number[] = [];

  for (let y = 130; y < 510; y += 1) {
    let hasInk = false;
    for (let x = 70; x < 1130 && !hasInk; x += 1) {
      const offset = (y * info.width + x) * info.channels;
      hasInk = (data[offset] ?? 0) > 180;
    }
    if (hasInk) {
      inkRows.push(y);
    }
  }

  let groups = 0;
  for (const [index, row] of inkRows.entries()) {
    if (index === 0 || row > (inkRows[index - 1] ?? row) + 1) {
      groups += 1;
    }
  }
  return groups;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("social-image renderer", () => {
  test("renders a deterministic offline 1200×630 PNG", async () => {
    const nativeFetch = globalThis.fetch;
    const fetch = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        const url = toFetchUrl(input);
        if (!url.startsWith("data:")) {
          throw new Error(
            `Social-image rendering attempted remote fetch: ${url}`
          );
        }
        return await nativeFetch(input, init);
      }
    );
    vi.stubGlobal("fetch", fetch);

    const first = await toBytes(ARTICLE_INPUT);
    const second = await toBytes(ARTICLE_INPUT);
    const metadata = await sharp(first).metadata();

    expect(first.subarray(0, PNG_SIGNATURE.length)).toEqual(PNG_SIGNATURE);
    expect(metadata).toMatchObject({
      format: "png",
      height: SOCIAL_IMAGE_SIZE.height,
      width: SOCIAL_IMAGE_SIZE.width,
    });
    expect(second).toEqual(first);
    expect(
      fetch.mock.calls.every(([input]) => toFetchUrl(input).startsWith("data:"))
    ).toBe(true);
  });

  test("keeps a maximum-length unbroken Article title inside fixed output bounds", async () => {
    const title = "W".repeat(100);
    const bytes = await toBytes({
      alt: `${title} — Levin Bänninger`,
      label: "Article",
      title,
    });

    await expect(sharp(bytes).metadata()).resolves.toMatchObject({
      height: 630,
      width: 1200,
    });
    await expect(countTitleLineGroups(bytes)).resolves.toBe(4);
  });

  test.each([
    ["portfolio", PORTFOLIO_INPUT],
    ["blog", BLOG_INPUT],
    ["article", ARTICLE_INPUT],
  ] as const)("matches the reviewed %s golden", async (family, input) => {
    const goldenUrl = new URL(`__goldens__/${family}.png`, import.meta.url);
    const rendered = await toBytes(input);

    if (process.env.SOCIAL_IMAGE_GOLDENS === "review") {
      await writeFile(goldenUrl, rendered);
    }

    await expect(readFile(goldenUrl)).resolves.toEqual(rendered);
  });
});
