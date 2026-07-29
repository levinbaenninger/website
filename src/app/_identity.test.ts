import { describe, expect, test } from "vite-plus/test";

import {
  AUTHOR_IDENTITY,
  BLOG_IDENTITY,
  PORTFOLIO_IDENTITY,
  SITE_IDENTITY,
  toCanonicalUrl,
} from "./_identity";

describe("canonical app identity", () => {
  test("uses the immutable production identity without deployment inputs", () => {
    expect(SITE_IDENTITY).toEqual({
      alternateName: "levin.baenninger.me",
      name: "Levin Bänninger",
      origin: "https://levin.baenninger.me",
      twitterHandle: "@levinbaenninger",
    });
    expect(PORTFOLIO_IDENTITY).toEqual({
      email: "levin@baenninger.me",
      handle: "levinbaenninger",
      image: "/images/profile.png",
      name: "Levin Bänninger",
      profiles: {
        github: "https://github.com/levinbaenninger",
        linkedin: "https://linkedin.com/in/levinbaenninger",
        x: "https://x.com/levinbaenninger",
      },
      tagline:
        "Wrangling components by day, tinkering with side projects by night.",
    });
    expect(BLOG_IDENTITY).toEqual({
      description:
        "Writing about nerdy stuff—mostly software, the web, and whatever else catches my attention.",
      name: "Levin Bänninger’s Blog",
      title: "Blog | Levin Bänninger",
    });
    expect(AUTHOR_IDENTITY).toEqual({
      email: "levin@baenninger.me",
      handle: "levinbaenninger",
      image: "/images/profile.png",
      name: "Levin Bänninger",
      profiles: {
        github: "https://github.com/levinbaenninger",
        linkedin: "https://linkedin.com/in/levinbaenninger",
        x: "https://x.com/levinbaenninger",
      },
      url: "https://levin.baenninger.me",
    });
  });

  test("composes canonical URLs with the root-only trailing slash policy", () => {
    expect(toCanonicalUrl("/")).toBe("https://levin.baenninger.me/");
    expect(toCanonicalUrl("/blog/")).toBe("https://levin.baenninger.me/blog");
    expect(toCanonicalUrl("/blog/an-article///")).toBe(
      "https://levin.baenninger.me/blog/an-article"
    );
  });
});
