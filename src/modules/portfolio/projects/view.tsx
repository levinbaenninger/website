import { BoxIcon } from "lucide-react";

import { TimelineItem } from "@/modules/portfolio/timeline/item";
import { TimelineList } from "@/modules/portfolio/timeline/list";
import {
  TimelineMetadata,
  TimelineMetadataItem,
  TimelinePeriod,
} from "@/modules/portfolio/timeline/metadata";
import { TimelineTrack } from "@/modules/portfolio/timeline/track";
import { TimelineView } from "@/modules/portfolio/timeline/view";

import { PROJECTS } from "./content";
import type { Project } from "./content";

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

export const ProjectsView = ({ max }: { max?: number }) => (
  <TimelineView id="projects" title="Projects">
    <TimelineList max={max}>
      {PROJECTS.map((project) => (
        <ProjectItem key={project.id} project={project} />
      ))}
    </TimelineList>
  </TimelineView>
);
