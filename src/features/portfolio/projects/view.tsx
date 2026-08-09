import { BoxIcon, GlobeIcon } from "lucide-react";

import { GitHubIcon } from "@/features/portfolio/icons/github-icon";
import { TimelineExternalAction } from "@/features/portfolio/timeline/external-action";
import { TimelineItem } from "@/features/portfolio/timeline/item";
import { TimelineList } from "@/features/portfolio/timeline/list";
import {
  TimelineMetadata,
  TimelineMetadataItem,
  TimelinePeriod,
} from "@/features/portfolio/timeline/metadata";
import { TimelineTrack } from "@/features/portfolio/timeline/track";
import { TimelineView } from "@/features/portfolio/timeline/view";

import { PROJECTS } from "./content";
import type { Project } from "./content";

const ProjectLinks = ({ links }: { links: NonNullable<Project["links"]> }) => (
  <>
    {typeof links.liveSite === "string" ? (
      <TimelineExternalAction href={links.liveSite} label="Open live site">
        <GlobeIcon aria-hidden />
      </TimelineExternalAction>
    ) : null}
    {typeof links.githubRepository === "string" ? (
      <TimelineExternalAction
        href={links.githubRepository}
        label="View GitHub repository"
      >
        <GitHubIcon aria-hidden />
      </TimelineExternalAction>
    ) : null}
  </>
);

const ProjectItem = ({ project }: { project: Project }) => (
  <article
    id={`project-${project.id}`}
    className="screen-line-bottom scroll-mt-14 py-4"
  >
    <TimelineTrack>
      <TimelineItem
        actions={
          project.links ? <ProjectLinks links={project.links} /> : undefined
        }
        description={project.description}
        heading={<h3 className="font-medium text-balance">{project.title}</h3>}
        icon={<BoxIcon aria-hidden />}
        tags={project.skills}
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
