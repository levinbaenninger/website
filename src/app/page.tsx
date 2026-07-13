import Image from "next/image";

import { SpotlightLogo } from "@/app/_shell/branding/spotlight-logo";
import { RotatingIntroduction } from "@/modules/portfolio";

export default function Home() {
  return (
    <section className="screen-line-bottom mx-auto w-full border-x md:w-3xl grid grid-cols-[auto_1fr] grid-rows-[1fr_auto]">
      <figure className="col-span-2 sm:col-span-1 sm:col-start-2 p-4 relative">
        <SpotlightLogo />
        <figcaption className="pointer-events-none absolute right-2 bottom-2 font-mono text-xs leading-none text-zinc-400 select-none sm:right-4 dark:text-zinc-700">
          FIG_001
        </figcaption>
      </figure>

      <div className="flex sm:row-span-2 sm:row-start-1 mt-auto screen-line-top border-r border-line">
        <Image
          className="rounded-full"
          src="/images/profile.png"
          alt="Profile"
          loading="eager"
          width={160}
          height={160}
        />
      </div>

      <div className="col-start-2 flex flex-col justify-center gap-2 border-t border-line">
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl ps-4 pt-2">
          Levin Bänninger
        </h1>
        <RotatingIntroduction />
      </div>
    </section>
  );
}
