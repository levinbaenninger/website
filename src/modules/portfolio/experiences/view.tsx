import { BriefcaseBusinessIcon } from "lucide-react";

import { TimelineItem } from "@/modules/portfolio/timeline/item";
import {
  TimelineMetadata,
  TimelineMetadataItem,
  TimelinePeriod,
} from "@/modules/portfolio/timeline/metadata";
import { TimelineView } from "@/modules/portfolio/timeline/view";

import { EXPERIENCES } from "./content";
import { ExperienceDuration } from "./experience-duration";
import { ExperienceItem } from "./experience-item";

export const ExperiencesView = () => (
  <TimelineView id="experience" title="Experience">
    {EXPERIENCES.map((experience) => (
      <ExperienceItem experience={experience} key={experience.id}>
        {experience.positions.map((position) => (
          <TimelineItem
            description={position.description}
            heading={
              <h4 className="flex-1 font-medium text-balance">
                {position.title}
              </h4>
            }
            icon={<BriefcaseBusinessIcon aria-hidden />}
            key={position.id}
            skills={position.skills}
          >
            <TimelineMetadata>
              <TimelineMetadataItem label="Employment type">
                {position.employmentType}
              </TimelineMetadataItem>
              <TimelinePeriod
                endDate={position.endDate}
                label="Employment period"
                startDate={position.startDate}
              />
              <TimelineMetadataItem label="Duration">
                <ExperienceDuration
                  endDate={position.endDate}
                  startDate={position.startDate}
                />
              </TimelineMetadataItem>
            </TimelineMetadata>
          </TimelineItem>
        ))}
      </ExperienceItem>
    ))}
  </TimelineView>
);
