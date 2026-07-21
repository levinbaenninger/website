export const ABOUT_CONTENT = {
  employment: {
    company: "Bühler",
    role: "Software Engineer Apprentice",
  },
  introduction: {
    avatar: {
      alt: "Profile",
      src: "/images/profile.png",
    },
    descriptions: [
      "Building useful things for the web.",
      "Writing down what I learn.",
      "Collecting ideas worth keeping.",
    ],
  },
  biography: {
    paragraphs: [
      "By day I wrangle our component library so teams ship faster without breaking UX; by night I tinker on side projects for fun. I like clean APIs, tidy repos, and code that explains itself. Coffee-powered, test-approved, always learning.",
    ],
  },
  overview: {
    email: "levin@baenninger.me",
    location: {
      href: "https://maps.app.goo.gl/XruCEPhmEibs6vqm8",
      label: "Switzerland",
    },
    timeZone: "Europe/Zurich",
    website: {
      href: "https://levin.baenninger.me",
      label: "levin.baenninger.me",
    },
  },
} as const;
