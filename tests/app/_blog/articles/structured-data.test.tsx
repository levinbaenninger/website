import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";

import {
  ArticleStructuredData,
  serializeJsonLd,
} from "@/app/_blog/articles/structured-data";
import type { ArticleDetail } from "@/modules/blog/articles";

const Content = () => null;
const cover = { height: 630, src: "/cover.png", width: 1200 };
const publishedArticle = {
  Content,
  cover,
  description: "Safe </script><script>alert('xss')</script>",
  discovery: {
    cover,
    description: "Safe </script><script>alert('xss')</script>",
    href: "/blog/canonical-article",
    publishedAt: "2026-01-15",
    tags: [{ id: "nextjs", label: "Next.js" }],
    title: "Canonical Article",
    updatedAt: "2026-07-15",
  },
  href: "/blog/canonical-article",
  publishedAt: "2026-01-15",
  slug: "canonical-article",
  status: "published",
  tags: [{ id: "nextjs", label: "Next.js" }],
  title: "Canonical Article",
  updatedAt: "2026-07-15",
  navigation: { next: null, previous: null },
} as const satisfies ArticleDetail;

describe("Article structured data", () => {
  test("renders a grounded BlogPosting for a Published Article", () => {
    const markup = renderToStaticMarkup(
      <ArticleStructuredData article={publishedArticle} />
    );
    const prefix = '<script type="application/ld+json">';
    const suffix = "</script>";
    expect(markup.startsWith(prefix)).toBe(true);
    expect(markup.endsWith(suffix)).toBe(true);
    const serialized = markup.slice(prefix.length, -suffix.length);

    expect(serialized).not.toContain("</script>");

    const parsed: unknown = JSON.parse(serialized);
    expect(parsed).toEqual({
      "@context": "https://schema.org",
      "@id": "https://levin.baenninger.me/blog/canonical-article#article",
      "@type": "BlogPosting",
      author: {
        "@id": "https://levin.baenninger.me/#person",
        "@type": "Person",
        name: "Levin Bänninger",
        url: "https://levin.baenninger.me/",
      },
      dateModified: "2026-07-15T00:00:00+02:00",
      datePublished: "2026-01-15T00:00:00+01:00",
      description: "Safe </script><script>alert('xss')</script>",
      headline: "Canonical Article",
      image: "https://levin.baenninger.me/cover.png",
      inLanguage: "en",
      keywords: ["Next.js"],
      mainEntityOfPage: "https://levin.baenninger.me/blog/canonical-article",
      url: "https://levin.baenninger.me/blog/canonical-article",
    });
  });

  test("omits structured data for a Draft", () => {
    const draft = {
      ...publishedArticle,
      discovery: null,
      publishedAt: null,
      status: "draft",
      updatedAt: null,
      navigation: { next: null, previous: null },
    } as const satisfies ArticleDetail;

    expect(
      renderToStaticMarkup(<ArticleStructuredData article={draft} />)
    ).toBe("");
  });

  test("escapes HTML-significant less-than characters", () => {
    expect(serializeJsonLd({ value: "</script>" })).toBe(
      '{"value":"\\u003c/script>"}'
    );
  });
});
