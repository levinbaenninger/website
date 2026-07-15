import { BookmarkIcon } from "lucide-react";

import { TimelineExternalLinkItem } from "@/modules/portfolio/timeline/external-link-item";
import { TimelineList } from "@/modules/portfolio/timeline/list";
import {
  TimelineMetadata,
  TimelineMetadataItem,
} from "@/modules/portfolio/timeline/metadata";
import { TimelineTrack } from "@/modules/portfolio/timeline/track";
import { TimelineView } from "@/modules/portfolio/timeline/view";

import { BOOKMARKS } from "./content";
import type { Bookmark } from "./content";

const BookmarkItem = ({ bookmark }: { bookmark: Bookmark }) => (
  <article
    id={`bookmark-${bookmark.id}`}
    className="screen-line-bottom scroll-mt-14 py-4"
  >
    <TimelineTrack>
      <TimelineExternalLinkItem
        heading={<h3 className="font-medium text-balance">{bookmark.title}</h3>}
        href={bookmark.href}
        icon={<BookmarkIcon aria-hidden />}
      >
        <TimelineMetadata>
          <TimelineMetadataItem label="Author">
            {bookmark.author}
          </TimelineMetadataItem>
          <TimelineMetadataItem label="Bookmark type">
            {bookmark.type}
          </TimelineMetadataItem>
          <TimelineMetadataItem label="Bookmark date">
            {bookmark.date}
          </TimelineMetadataItem>
        </TimelineMetadata>
      </TimelineExternalLinkItem>
    </TimelineTrack>
  </article>
);

export const BookmarksView = ({ max }: { max?: number }) => (
  <TimelineView id="bookmarks" title="Bookmarks">
    <TimelineList max={max}>
      {BOOKMARKS.map((bookmark) => (
        <BookmarkItem bookmark={bookmark} key={bookmark.id} />
      ))}
    </TimelineList>
  </TimelineView>
);
