import type { Experience } from "./content";
import { ExperiencePositionItem } from "./experience-position-item";

export const ExperienceItem = ({ experience }: { experience: Experience }) => {
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

      <div className="relative flex flex-col gap-4 before:absolute before:top-0 before:bottom-0 before:left-3 before:w-px before:bg-border">
        {experience.positions.map((position) => (
          <ExperiencePositionItem position={position} key={position.id} />
        ))}
      </div>
    </article>
  );
};
