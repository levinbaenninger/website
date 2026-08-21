import { readFile } from "node:fs/promises";

import { describe, expect, test } from "vite-plus/test";

import BlogOpenGraphImage, { alt, contentType, size } from "./opengraph-image";
import BlogTwitterImage from "./twitter-image";

const responseBytes = async (response: Response): Promise<Buffer> =>
  Buffer.from(await response.arrayBuffer());

describe("Blog social-image adapters", () => {
  test("exposes exact metadata and identical OG/Twitter pixels", async () => {
    expect({ alt, contentType, size }).toStrictEqual({
      alt: "Levin Bänninger: Blog",
      contentType: "image/png",
      size: { height: 630, width: 1200 },
    });

    const golden = await readFile(
      new URL(
        "../../shared/social-image/__tests__/__goldens__/blog.png",
        import.meta.url
      )
    );
    await expect(responseBytes(BlogOpenGraphImage())).resolves.toStrictEqual(
      golden
    );
    await expect(responseBytes(BlogTwitterImage())).resolves.toStrictEqual(
      golden
    );
  });
});
