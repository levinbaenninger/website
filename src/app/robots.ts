import type { MetadataRoute } from "next";

import { toCanonicalUrl } from "@/app/_config/site-identity";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { allow: "/", userAgent: "*" },
    sitemap: toCanonicalUrl("/sitemap.xml"),
  };
}
