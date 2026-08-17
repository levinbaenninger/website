// Transposed from ncdai/chanhdai.com @ 83e0b842 (MIT, © Chánh Đại).

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { formatArticleDate } from "@/features/blog/articles/article-date";
import type {
  ArticleNeighbourLink,
  ArticleReaderNavigation,
  ArticleSummary,
} from "@/features/blog/articles/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/ui/cn";
import { Kbd } from "@/shared/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import {
  ARTICLE_NEIGHBOUR_ATTRIBUTE,
  ARTICLE_TITLE_SLOT,
} from "./reader-contract";
import { ArticleShareMenu } from "./share-menu";
import { StickyArticleTitle } from "./sticky-title";

export const ReaderRail = ({
  children,
  className,
}: {
  readonly children?: React.ReactNode;
  readonly className?: string;
}) => (
  <div
    className={cn("mx-auto w-full border-x border-line md:w-3xl", className)}
  >
    {children}
  </div>
);

export const ReaderTopLine = () => <div className="screen-line-bottom h-px" />;

// `screen-line-top` is a `::before` at `top: 0` and `screen-line-bottom` an `::after` at `bottom: 0`.
// Stacked under the toolbar's bottom rule they would draw two adjacent 1 px lines; the toolbar owns the rule that must survive scrolling.
const ReaderTitleSpacer = () => (
  <div className="screen-line-bottom py-px screen-line-top-none">
    <div className="h-4" />
  </div>
);

export const ReaderBottomLine = () => <div className="screen-line-top h-4" />;

// Real `/blog`, never `history.back()`: a control that claims a destination has to go there.
// Prefetch is off because the link is on screen at every scroll position.
const BackToBlog = () => (
  <Button
    asChild
    className="h-7 gap-1.5 border-none px-0 tracking-wider text-muted-foreground hover:text-foreground hover:no-underline"
    size="sm"
    variant="link"
  >
    <Link aria-label="Back to Blog" href="/blog" prefetch={false}>
      <ArrowLeftIcon aria-hidden />
      Blog
    </Link>
  </Button>
);

// Marked with direction because these anchors are what the `h`/`l` keys click.
// Tooltip repeats the accessible name rather than adding the key to it: a screen reader should not hear the shortcut as part of what the control does.
const ToolbarNeighbourLink = ({
  direction,
  neighbour,
}: {
  readonly direction: "previous" | "next";
  readonly neighbour: ArticleNeighbourLink;
}) => {
  const label = direction === "previous" ? "Previous Article" : "Next Article";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          className="size-7 border-none"
          size="icon-sm"
          variant="secondary"
        >
          <Link
            aria-label={label}
            href={neighbour.href}
            prefetch={false}
            {...{ [ARTICLE_NEIGHBOUR_ATTRIBUTE]: direction }}
          >
            {direction === "previous" ? (
              <ArrowLeftIcon aria-hidden />
            ) : (
              <ArrowRightIcon aria-hidden />
            )}
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label} <Kbd>{direction === "previous" ? "H" : "L"}</Kbd>
      </TooltipContent>
    </Tooltip>
  );
};

// Omit unavailable neighbours rather than disable them: a control that cannot do anything is noise in the tab order.
// Share is omitted without a canonical URL (local Draft): the only link it could offer is one nobody else can open.
const ReaderToolbarActions = ({
  canonicalUrl,
  navigation,
  title,
}: {
  readonly canonicalUrl: string | null;
  readonly navigation: ArticleReaderNavigation;
  readonly title: string;
}) => (
  <div className="flex shrink-0 items-center gap-2">
    {canonicalUrl === null ? null : (
      <ArticleShareMenu canonicalUrl={canonicalUrl} title={title} />
    )}
    {navigation.previous === null ? null : (
      <ToolbarNeighbourLink
        direction="previous"
        neighbour={navigation.previous}
      />
    )}
    {navigation.next === null ? null : (
      <ToolbarNeighbourLink direction="next" neighbour={navigation.next} />
    )}
  </div>
);

// Equal `flex-1 basis-0` shoulders centre the title and hold width while it fades, so the action cluster does not shift.
export const ReaderToolbar = ({
  canonicalUrl,
  navigation,
  title,
}: {
  readonly canonicalUrl: string | null;
  readonly navigation: ArticleReaderNavigation;
  readonly title: string;
}) => (
  <div className="sticky top-12 z-40 bg-background/85 backdrop-blur">
    <ReaderRail className="screen-line-bottom flex items-center gap-2 p-2 pl-4">
      <div className="flex flex-1 basis-0 justify-start">
        <BackToBlog />
      </div>

      <StickyArticleTitle title={title} />

      <div className="flex flex-1 basis-0 justify-end">
        <ReaderToolbarActions
          canonicalUrl={canonicalUrl}
          navigation={navigation}
          title={title}
        />
      </div>
    </ReaderRail>
  </div>
);

const ArticleTitle = ({ children }: { readonly children: string }) => (
  <h1
    className="screen-line-bottom px-4 font-heading text-4xl font-medium tracking-tight text-balance"
    data-slot={ARTICLE_TITLE_SLOT}
  >
    {children}
  </h1>
);

// `updatedAt` equal to `publishedAt` is legal and redundant on screen. Drafts say unpublished instead of showing a date they have not earned.
// Tags are inert: a link here would send a reader out of the Article they opened.
const ArticleFacts = ({ article }: { readonly article: ArticleSummary }) => {
  // ISO dates compare lexicographically, and both are validated `YYYY-MM-DD`.
  const meaningfulUpdate =
    article.status === "published" &&
    article.updatedAt !== null &&
    article.updatedAt > article.publishedAt
      ? article.updatedAt
      : null;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-muted-foreground">
      {article.status === "draft" ? (
        <>
          <Badge className="rounded-md" variant="outline">
            Draft
          </Badge>
          <span>Not published</span>
        </>
      ) : (
        <span>
          Published on{" "}
          <time dateTime={article.publishedAt}>
            {formatArticleDate(article.publishedAt)}
          </time>
        </span>
      )}

      {meaningfulUpdate === null ? null : (
        <>
          <span aria-hidden>·</span>
          <span>
            Updated{" "}
            <time dateTime={meaningfulUpdate}>
              {formatArticleDate(meaningfulUpdate)}
            </time>
          </span>
        </>
      )}

      {/* No separator before the Tags: the Badges already read as a break, and
          a dangling "·" is what is left behind when the row wraps. */}
      {article.tags.length > 0 ? (
        <ul className="flex flex-wrap items-center gap-1.5">
          {article.tags.map((tag) => (
            <li key={tag.id}>
              <Badge className="rounded-md" variant="secondary">
                {tag.label}
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

// No Cover: a Cover represents an Article to someone deciding whether to open it, which the reader has done.
export const ArticleHeader = ({
  article,
}: {
  readonly article: ArticleSummary;
}) => (
  <>
    <ReaderTitleSpacer />
    <ArticleTitle>{article.title}</ArticleTitle>

    <div className="screen-line-bottom flex flex-col gap-2 px-4 py-4">
      <p className="text-base/7 text-pretty text-muted-foreground">
        {article.description}
      </p>
      <ArticleFacts article={article} />
    </div>
  </>
);

// Empty gutters stay inert; with no outline the right gutter is reclaimed rather than reserved for a control that never appears.
export const ReaderGrid = ({
  children,
  outline = null,
}: {
  readonly children: React.ReactNode;
  readonly outline?: React.ReactNode;
}) => (
  <div className="mx-auto grid w-full grid-cols-1 lg:grid-cols-[1fr_var(--container-3xl)_1fr]">
    <div aria-hidden className="max-lg:hidden" />
    {children}
    {outline === null ? (
      <div aria-hidden className="max-lg:hidden" />
    ) : (
      <div className="max-lg:hidden">
        <div className="sticky top-26">{outline}</div>
      </div>
    )}
  </div>
);

// Own opening offset rather than inheriting the first authored block's margin. `pb-8` is not a mirror of `pt-8`: the last block has no collapsed margin, so padding is what makes the closing line sit like the opening one.
export const ProseColumn = ({
  children,
}: {
  readonly children: React.ReactNode;
}) => (
  <div className="px-4 pt-8 pb-8 [&>[data-slot=article-body]>:first-child]:mt-0">
    {children}
  </div>
);

// Levin's own; the reference Article ends at the prose.
// From `sm`, a missing Previous keeps its empty cell so Next stays on the right.
// Default prefetch: these duplicate the toolbar, so nothing is prepared until a reader has scrolled this far.
export const EndPager = ({
  navigation,
}: {
  readonly navigation: ArticleReaderNavigation;
}) => {
  const { next, previous } = navigation;

  if (previous === null && next === null) {
    return null;
  }

  return (
    <nav
      aria-label="Neighbouring Articles"
      className="screen-line-top grid grid-cols-1 sm:grid-cols-2"
    >
      {previous === null ? (
        <div className="hidden sm:block" />
      ) : (
        <Link
          className="flex flex-col gap-1 border-line p-4 transition-colors hover:bg-accent max-sm:screen-line-bottom sm:border-r"
          href={previous.href}
        >
          <span className="flex items-center gap-1 text-sm tracking-wider text-muted-foreground">
            <ArrowLeftIcon aria-hidden className="size-3.5" />
            Previous
          </span>
          <span className="text-[0.9375rem]/6 font-medium text-balance">
            {previous.title}
          </span>
        </Link>
      )}

      {next === null ? null : (
        <Link
          className="flex flex-col items-end gap-1 p-4 text-right transition-colors hover:bg-accent"
          href={next.href}
        >
          <span className="flex items-center gap-1 text-sm tracking-wider text-muted-foreground">
            Next
            <ArrowRightIcon aria-hidden className="size-3.5" />
          </span>
          <span className="text-[0.9375rem]/6 font-medium text-balance">
            {next.title}
          </span>
        </Link>
      )}
    </nav>
  );
};
