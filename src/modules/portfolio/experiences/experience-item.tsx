import { TimelineTrack } from "@/modules/portfolio/timeline/track";

import type { Experience } from "./content";

export const ExperienceItem = ({
  children,
  experience,
}: {
  children: React.ReactNode;
  experience: Experience;
}) => {
  const CompanyLogo = experience.company.logo;

  return (
    <article
      id={`experience-${experience.id}`}
      className="group/experience screen-line-bottom flex scroll-mt-14 flex-col gap-4 py-4"
    >
      <div className="flex items-start gap-3 sm:items-center">
        <div className="flex size-6 shrink-0 items-center justify-center">
          <CompanyLogo className="size-6" aria-hidden />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-x-3 gap-y-1 pr-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h3 className="text-xl/6 font-medium">
            <a
              className="decoration-1 underline-offset-3 hover:underline"
              href={experience.company.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {experience.company.name}
            </a>
          </h3>

          <dl className="flex min-w-0 items-center gap-1.5 text-sm whitespace-nowrap text-muted-foreground">
            <dt className="sr-only">Location</dt>
            <dd className="truncate">{experience.location}</dd>

            <dt className="sr-only">Location type</dt>
            <dd>({experience.locationType})</dd>
          </dl>
        </div>
      </div>

      <TimelineTrack>{children}</TimelineTrack>
    </article>
  );
};
