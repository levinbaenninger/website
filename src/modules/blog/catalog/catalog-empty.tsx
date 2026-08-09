import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";

/**
 * The centered block that replaces the grid whenever there is nothing to show.
 * Loading, error and no-result variants join it with the search island.
 *
 * `action` carries whatever widens the catalog again — each one clears exactly
 * the constraint it names, and nothing else.
 */
export const CatalogEmpty = ({
  action,
  description,
  media,
  title,
}: {
  action?: React.ReactNode;
  description: string;
  media: React.ReactNode;
  title: string;
}) => (
  <div className="screen-line-top screen-line-bottom mt-4 py-12">
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">{media}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action === undefined ? null : <EmptyContent>{action}</EmptyContent>}
    </Empty>
  </div>
);
