import { FactoryIcon } from "lucide-react";

import { EXPERIENCE_CONTENT } from "./content";
import { ExperiencePositionItem } from "./experience-position-item";

export const ExperienceItem = () => (
  <article id="experience-buhler" className="scroll-mt-14 py-4">
    <div className="mb-4 flex items-center gap-3">
      <div className="flex size-6 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-5">
        <FactoryIcon aria-hidden />
      </div>

      <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
        <h3 className="text-xl/6 font-medium">
          <a
            className="decoration-1 underline-offset-3 hover:underline"
            href={EXPERIENCE_CONTENT.company.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {EXPERIENCE_CONTENT.company.name}
          </a>
        </h3>

        <p className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
          <span
            className="relative flex size-2.5 items-center justify-center"
            aria-hidden
          >
            <span className="absolute size-2.5 animate-ping rounded-full bg-foreground/30 motion-reduce:animate-none" />
            <span className="relative size-1.5 rounded-full bg-foreground/70" />
          </span>
          Current
        </p>
      </div>
    </div>

    <div className="relative before:absolute before:top-0 before:bottom-0 before:left-3 before:w-px before:bg-border">
      <ExperiencePositionItem />
    </div>
  </article>
);
