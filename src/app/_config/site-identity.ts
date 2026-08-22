export const SITE_IDENTITY = {
  alternateName: "levin.baenninger.me",
  name: "Levin Bänninger",
  origin: "https://levin.baenninger.me",
  twitterHandle: "@levinbaenninger",
} as const;

export const PORTFOLIO_IDENTITY = {
  email: "levin@baenninger.me",
  handle: "levinbaenninger",
  image: "/images/profile.png",
  name: SITE_IDENTITY.name,
  profiles: {
    github: "https://github.com/levinbaenninger",
    linkedin: "https://linkedin.com/in/levinbaenninger",
    x: "https://x.com/levinbaenninger",
  },
  tagline:
    "Wrangling components by day, tinkering with side projects by night.",
} as const;

export const AUTHOR_IDENTITY = {
  email: PORTFOLIO_IDENTITY.email,
  handle: PORTFOLIO_IDENTITY.handle,
  image: PORTFOLIO_IDENTITY.image,
  name: PORTFOLIO_IDENTITY.name,
  profiles: PORTFOLIO_IDENTITY.profiles,
  url: SITE_IDENTITY.origin,
} as const;

export const toCanonicalUrl = (pathname: `/${string}`): string => {
  const canonicalPathname =
    pathname === "/" ? pathname : pathname.replace(/\/+$/u, "");
  return new URL(canonicalPathname, SITE_IDENTITY.origin).href;
};
