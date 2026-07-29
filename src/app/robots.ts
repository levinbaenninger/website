import type { MetadataRoute } from "next";

import { createRobotsPolicy } from "@/app/_blog/discovery";

export default function robots(): MetadataRoute.Robots {
  return createRobotsPolicy();
}
