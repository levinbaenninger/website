import { SpotlightLogo } from "./spotlight-logo";

export const IntroductionArtwork = () => (
  <figure className="relative col-span-2 p-4 sm:col-span-1 sm:col-start-2">
    <SpotlightLogo />
    <figcaption className="pointer-events-none absolute right-2 bottom-2 font-mono text-xs leading-none text-zinc-400 select-none sm:right-4 dark:text-zinc-700">
      FIG_001
    </figcaption>
  </figure>
);
