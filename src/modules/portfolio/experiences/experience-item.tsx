import { FactoryIcon } from "lucide-react";

import { EXPERIENCE_CONTENT } from "./content";
import { ExperiencePositionItem } from "./experience-position-item";

export const ExperienceItem = () => (
  <article id="experience-buhler" className="scroll-mt-14 py-4">
    <div className="mb-4 flex items-start gap-3 sm:items-center">
      <div className="flex size-6 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-5">
        <FactoryIcon aria-hidden />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-x-3 gap-y-1 pr-1 sm:flex-row sm:items-baseline sm:justify-between">
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

        <dl className="flex min-w-0 items-center gap-1.5 text-sm whitespace-nowrap text-muted-foreground">
          <dt className="sr-only">Location</dt>
          <dd className="truncate">{EXPERIENCE_CONTENT.location}</dd>

          <dt className="sr-only">Location type</dt>
          <dd>({EXPERIENCE_CONTENT.locationType})</dd>
        </dl>
      </div>
    </div>

    <div className="relative before:absolute before:top-0 before:bottom-0 before:left-3 before:w-px before:bg-border">
      <ExperiencePositionItem />
    </div>
  </article>
);
