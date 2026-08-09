import { readFile } from "node:fs/promises";

import { describe, expect, test } from "vite-plus/test";

import PortfolioOpenGraphImage, {
  alt,
  contentType,
  size,
} from "./opengraph-image";
import PortfolioTwitterImage from "./twitter-image";

const responseBytes = async (response: Response): Promise<Buffer> =>
  Buffer.from(await response.arrayBuffer());

describe("Portfolio social-image adapters", () => {
  test("exposes exact metadata and identical OG/Twitter pixels", async () => {
    expect({ alt, contentType, size }).toEqual({
      alt: "Levin Bänninger — Portfolio",
      contentType: "image/png",
      size: { height: 630, width: 1200 },
    });

    const golden = await readFile(
      new URL(
        "../shared/social-image/__tests__/__goldens__/portfolio.png",
        import.meta.url
      )
    );
    await expect(responseBytes(PortfolioOpenGraphImage())).resolves.toEqual(
      golden
    );
    await expect(responseBytes(PortfolioTwitterImage())).resolves.toEqual(
      golden
    );
  });
});
