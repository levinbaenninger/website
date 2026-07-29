import { readFile } from "node:fs/promises";

import { describe, expect, test } from "vite-plus/test";

import BlogOpenGraphImage, {
  alt as blogAlt,
  contentType as blogContentType,
  size as blogSize,
} from "@/app/blog/opengraph-image";
import BlogTwitterImage from "@/app/blog/twitter-image";
import PortfolioOpenGraphImage, {
  alt as portfolioAlt,
  contentType as portfolioContentType,
  size as portfolioSize,
} from "@/app/opengraph-image";
import PortfolioTwitterImage from "@/app/twitter-image";

const responseBytes = async (response: Response): Promise<Buffer> =>
  Buffer.from(await response.arrayBuffer());

describe("static social-image adapters", () => {
  test("exposes exact Portfolio metadata and identical OG/Twitter pixels", async () => {
    expect({
      alt: portfolioAlt,
      contentType: portfolioContentType,
      size: portfolioSize,
    }).toEqual({
      alt: "Levin Bänninger — Portfolio",
      contentType: "image/png",
      size: { height: 630, width: 1200 },
    });

    const golden = await readFile(
      new URL(
        "../../shared/social-image/__goldens__/portfolio.png",
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

  test("exposes exact Blog metadata and identical OG/Twitter pixels", async () => {
    expect({
      alt: blogAlt,
      contentType: blogContentType,
      size: blogSize,
    }).toEqual({
      alt: "Levin Bänninger — Blog",
      contentType: "image/png",
      size: { height: 630, width: 1200 },
    });

    const golden = await readFile(
      new URL("../../shared/social-image/__goldens__/blog.png", import.meta.url)
    );
    await expect(responseBytes(BlogOpenGraphImage())).resolves.toEqual(golden);
    await expect(responseBytes(BlogTwitterImage())).resolves.toEqual(golden);
  });
});
