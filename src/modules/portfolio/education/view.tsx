import { GraduationCapIcon } from "lucide-react";

import { TimelineItem } from "@/modules/portfolio/timeline/item";
import {
  TimelineMetadata,
  TimelineMetadataItem,
  TimelinePeriod,
} from "@/modules/portfolio/timeline/metadata";
import { TimelineTrack } from "@/modules/portfolio/timeline/track";
import { TimelineView } from "@/modules/portfolio/timeline/view";

import { EDUCATION } from "./content";

export const EducationView = () => (
  <TimelineView id="education" title="Education">
    {EDUCATION.map((education) => (
      <article
        id={`education-${education.id}`}
        className="screen-line-bottom scroll-mt-14 py-4"
        key={education.id}
      >
        <TimelineTrack>
          <TimelineItem
            description={education.description}
            heading={
              <h3 className="flex-1 font-medium text-balance">
                {education.institution}
              </h3>
            }
            icon={<GraduationCapIcon aria-hidden />}
            skills={education.skills}
          >
            <TimelineMetadata>
              <TimelinePeriod
                endDate={education.endDate}
                label="Education period"
                startDate={education.startDate}
              />
              <TimelineMetadataItem label="Qualification">
                {education.qualification}
              </TimelineMetadataItem>
              <TimelineMetadataItem label="Field of study">
                {education.field}
              </TimelineMetadataItem>
            </TimelineMetadata>
          </TimelineItem>
        </TimelineTrack>
      </article>
    ))}
  </TimelineView>
);
