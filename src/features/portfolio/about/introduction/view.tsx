import Image from "next/image";

import { IntroductionDescription } from "./description";
import { SpotlightLogo } from "./spotlight-logo";

export const IntroductionView = ({
  avatar,
  descriptions,
  name,
}: {
  avatar: { alt: string; src: string };
  descriptions: readonly string[];
  name: string;
}) => (
  <section
    id="about"
    // fallow-ignore-next-line css-token-drift
    className="screen-line-bottom mx-auto grid w-full grid-cols-[auto_1fr] grid-rows-[1fr_auto] border-x border-line md:w-3xl"
  >
    <figure className="relative col-span-2 p-4 sm:col-span-1 sm:col-start-2">
      <SpotlightLogo />
      <figcaption className="pointer-events-none absolute right-2 bottom-2 font-mono text-xs leading-none text-zinc-400 select-none sm:right-4 dark:text-zinc-700">
        FIG_001
      </figcaption>
    </figure>
    <div className="screen-line-top mt-auto flex border-r border-line sm:row-span-2 sm:row-start-1">
      <Image
        className="size-32 rounded-full md:size-40"
        src={avatar.src}
        alt={avatar.alt}
        fetchPriority="high"
        loading="eager"
        width={160}
        height={160}
      />
    </div>

    <div className="col-start-2 grid grid-rows-[1fr_auto] border-t border-line sm:flex sm:flex-col sm:justify-center sm:gap-2">
      <h1 className="flex items-end ps-4 pb-2 text-2xl font-bold tracking-tight sm:block sm:pt-2 sm:pb-0 sm:text-4xl">
        {name}
      </h1>
      <IntroductionDescription introductions={descriptions} />
    </div>
  </section>
);
