import { BoxIcon, ChevronDownIcon } from "lucide-react";

import { TimelineItem } from "@/modules/portfolio/timeline/item";
import {
  TimelineMetadata,
  TimelineMetadataItem,
  TimelinePeriod,
} from "@/modules/portfolio/timeline/metadata";
import { TimelineTrack } from "@/modules/portfolio/timeline/track";
import { TimelineView } from "@/modules/portfolio/timeline/view";
import { Button } from "@/shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";

import { PROJECTS } from "./content";
import type { Project } from "./content";

const DEFAULT_MAX_VISIBLE_PROJECTS = 3;

const ProjectItem = ({ project }: { project: Project }) => (
  <article
    id={`project-${project.id}`}
    className="screen-line-bottom scroll-mt-14 py-4"
  >
    <TimelineTrack>
      <TimelineItem
        description={project.description}
        heading={<h3 className="font-medium text-balance">{project.title}</h3>}
        icon={<BoxIcon aria-hidden />}
        skills={project.skills}
      >
        <TimelineMetadata>
          <TimelinePeriod
            endDate={project.endDate}
            label="Project period"
            startDate={project.startDate}
          />
          <TimelineMetadataItem label="Project type">
            {project.kind}
          </TimelineMetadataItem>
          <TimelineMetadataItem label="Project status">
            {project.status}
          </TimelineMetadataItem>
        </TimelineMetadata>
      </TimelineItem>
    </TimelineTrack>
  </article>
);

export const ProjectsView = ({
  max = DEFAULT_MAX_VISIBLE_PROJECTS,
}: {
  max?: number;
}) => {
  const visibleCount = Math.max(0, max);
  const visibleProjects = PROJECTS.slice(0, visibleCount);
  const additionalProjects = PROJECTS.slice(visibleCount);

  return (
    <TimelineView id="projects" title="Projects">
      <Collapsible className="group/collapsible">
        {visibleProjects.map((project) => (
          <ProjectItem key={project.id} project={project} />
        ))}

        <CollapsibleContent>
          {additionalProjects.map((project) => (
            <ProjectItem key={project.id} project={project} />
          ))}
        </CollapsibleContent>

        {additionalProjects.length > 0 ? (
          <div className="screen-line-top -mt-px flex h-12 items-center justify-center">
            <CollapsibleTrigger asChild>
              <Button
                className="gap-2 pr-2.5 pl-3"
                size="sm"
                variant="secondary"
              >
                <span className="hidden group-data-closed/collapsible:block">
                  Show more
                </span>
                <span className="hidden group-data-open/collapsible:block">
                  Show less
                </span>
                <ChevronDownIcon className="transition-transform group-data-open/collapsible:rotate-180" />
              </Button>
            </CollapsibleTrigger>
          </div>
        ) : null}
      </Collapsible>
    </TimelineView>
  );
};
