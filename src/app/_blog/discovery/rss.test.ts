import { DOMParser } from "@xmldom/xmldom";
import { describe, expect, test } from "vite-plus/test";

import type { ArticleDiscoveryEntry } from "@/modules/blog/articles";

import { createRssResponse, serializeRss } from "./rss";

const cover = { height: 630, src: "/cover.png", width: 1200 };
const article = (
  slug: string,
  {
    description = `Description for ${slug}.`,
    publishedAt = "2026-01-15",
    tags = [{ id: "nextjs", label: "Next.js" }],
    title = `Article ${slug}`,
    updatedAt = null,
  }: Partial<ArticleDiscoveryEntry> = {}
): ArticleDiscoveryEntry => ({
  cover,
  description,
  href: `/blog/${slug}`,
  publishedAt,
  tags,
  title,
  updatedAt,
});

const parseXml = (xml: string) => {
  const errors: string[] = [];
  const document = new DOMParser({
    onError: (level, message) => {
      if (level === "error" || level === "fatalError") {
        errors.push(message);
      }
    },
  }).parseFromString(xml, "application/xml");

  expect(errors).toEqual([]);
  return document;
};

type XmlDocument = ReturnType<typeof parseXml>;
type XmlElement = NonNullable<XmlDocument["documentElement"]>;

const getElements = (
  parent: XmlDocument | XmlElement,
  tagName: string
): readonly XmlElement[] => [...parent.getElementsByTagNameNS("*", tagName)];

describe("RSS adapter", () => {
  test("returns valid deterministic RSS for an empty corpus", async () => {
    const first = createRssResponse([]);
    const second = createRssResponse([]);
    const [firstBody, secondBody] = await Promise.all([
      first.text(),
      second.text(),
    ]);

    expect(first.headers.get("content-type")).toBe(
      "application/rss+xml; charset=utf-8"
    );
    expect(first.headers.get("x-robots-tag")).toBe("noindex, follow");
    expect(firstBody).toBe(secondBody);

    const document = parseXml(firstBody);
    expect(document.documentElement?.tagName).toBe("rss");
    expect(getElements(document, "item")).toHaveLength(0);
    expect(getElements(document, "lastBuildDate")).toHaveLength(0);
  });

  test("serializes every Article in canonical order with exact identity and dates", () => {
    const xml = serializeRss([
      article("newer", {
        publishedAt: "2026-07-20",
        updatedAt: "2026-07-21",
      }),
      article("older", { publishedAt: "2026-01-15" }),
    ]);
    const document = parseXml(xml);
    const [channel] = getElements(document, "channel");
    const items = getElements(document, "item");

    expect(getElements(channel, "title")[0]?.textContent).toBe(
      "Levin Bänninger’s Blog"
    );
    expect(getElements(channel, "link")[0]?.textContent).toBe(
      "https://levin.baenninger.me/blog"
    );
    expect(getElements(channel, "description")[0]?.textContent).toBe(
      "Writing about nerdy stuff—mostly software, the web, and whatever else catches my attention."
    );
    expect(getElements(channel, "language")[0]?.textContent).toBe("en");
    const selfLink = getElements(channel, "link").find(
      (element) => element.namespaceURI === "http://www.w3.org/2005/Atom"
    );
    expect(selfLink?.getAttribute("href")).toBe(
      "https://levin.baenninger.me/blog/rss.xml"
    );
    expect(selfLink?.getAttribute("rel")).toBe("self");
    expect(selfLink?.getAttribute("type")).toBe("application/rss+xml");
    expect(
      items.map((item) => getElements(item, "link")[0]?.textContent)
    ).toEqual([
      "https://levin.baenninger.me/blog/newer",
      "https://levin.baenninger.me/blog/older",
    ]);
    expect(getElements(items[0], "guid")[0]?.getAttribute("isPermaLink")).toBe(
      "true"
    );
    expect(getElements(items[0], "guid")[0]?.textContent).toBe(
      getElements(items[0], "link")[0]?.textContent
    );
    expect(getElements(items[0], "pubDate")[0]?.textContent).toBe(
      "Sun, 19 Jul 2026 22:00:00 GMT"
    );
    expect(getElements(document, "lastBuildDate")[0]?.textContent).toBe(
      "Mon, 20 Jul 2026 22:00:00 GMT"
    );
  });

  test("escapes text and attributes without allowing markup injection", () => {
    const xml = serializeRss([
      article("injection", {
        description: `A & B <script>"quoted" 'value'</script>`,
        tags: [{ id: "safe", label: `Web & "XML"` }],
        title: `A <dangerous> & "quoted"`,
      }),
    ]);

    expect(xml).toContain("A &lt;dangerous&gt; &amp; &quot;quoted&quot;");
    expect(xml).toContain(
      "A &amp; B &lt;script&gt;&quot;quoted&quot; &apos;value&apos;&lt;/script&gt;"
    );
    expect(xml).not.toContain("<script>");

    const document = parseXml(xml);
    expect(getElements(document, "description")[1]?.textContent).toBe(
      `A & B <script>"quoted" 'value'</script>`
    );
    expect(getElements(document, "category")[0]?.textContent).toBe(
      `Web & "XML"`
    );
  });

  test("refuses characters forbidden by XML 1.0", () => {
    expect(() =>
      serializeRss([
        article("invalid-xml", {
          title: "Invalid\u0001title",
        }),
      ])
    ).toThrow(/XML 1\.0/u);
  });

  test("includes summary, creator identity, and every Tag but no Article body", () => {
    const xml = serializeRss([
      article("summary", {
        description: "Only the authored summary.",
        tags: [
          { id: "nextjs", label: "Next.js" },
          { id: "web-performance", label: "Web performance" },
        ],
      }),
    ]);
    const document = parseXml(xml);
    const [item] = getElements(document, "item");

    expect(getElements(item, "description")[0]?.textContent).toBe(
      "Only the authored summary."
    );
    expect(getElements(item, "author")[0]?.textContent).toBe(
      "levin@baenninger.me (Levin Bänninger)"
    );
    expect(getElements(item, "creator")[0]?.textContent).toBe(
      "Levin Bänninger"
    );
    expect(
      getElements(item, "category").map(({ textContent }) => textContent)
    ).toEqual(["Next.js", "Web performance"]);
    expect(xml).not.toContain("compiled");
    expect(xml).not.toContain("content:encoded");
  });
});
