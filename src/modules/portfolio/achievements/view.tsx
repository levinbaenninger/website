import { AwardIcon } from "lucide-react";

import { TimelineItem } from "@/modules/portfolio/timeline/item";
import {
  TimelineMetadata,
  TimelineMetadataItem,
} from "@/modules/portfolio/timeline/metadata";
import { TimelineTrack } from "@/modules/portfolio/timeline/track";
import { TimelineView } from "@/modules/portfolio/timeline/view";

import { ACHIEVEMENTS } from "./content";

export const AchievementsView = () => (
  <TimelineView id="achievements" title="Achievements">
    {ACHIEVEMENTS.length > 0 ? (
      ACHIEVEMENTS.map((achievement) => (
        <article
          id={`achievement-${achievement.id}`}
          className="screen-line-bottom scroll-mt-14 py-4"
          key={achievement.id}
        >
          <TimelineTrack>
            <TimelineItem
              description={achievement.description}
              heading={
                <h3 className="font-medium text-balance">
                  {achievement.title}
                </h3>
              }
              icon={<AwardIcon aria-hidden />}
            >
              <TimelineMetadata>
                <TimelineMetadataItem label="Achievement date">
                  {achievement.date}
                </TimelineMetadataItem>
                <TimelineMetadataItem label="Issuing organization">
                  {achievement.issuer}
                </TimelineMetadataItem>
              </TimelineMetadata>
            </TimelineItem>
          </TimelineTrack>
        </article>
      ))
    ) : (
      <p className="screen-line-bottom py-4 text-sm text-muted-foreground">
        Achievements will be added here.
      </p>
    )}
  </TimelineView>
);
