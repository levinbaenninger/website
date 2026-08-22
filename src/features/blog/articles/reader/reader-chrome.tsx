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

const ReaderTitleSpacer = () => (
  <div className="screen-line-bottom py-px screen-line-top-none">
    <div className="h-4" />
  </div>
);

export const ReaderBottomLine = () => <div className="screen-line-top h-4" />;

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

export const ReaderGrid = ({
  children,
  outline = null,
}: {
  readonly children: React.ReactNode;
  readonly outline?: React.ReactNode;
}) => (
  // fallow-ignore-next-line css-token-drift
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

export const ProseColumn = ({
  children,
}: {
  readonly children: React.ReactNode;
}) => (
  <div className="px-4 pt-8 pb-8 [&>[data-slot=article-body]>:first-child]:mt-0">
    {children}
  </div>
);

// From `sm`, a missing Previous keeps its empty cell so Next stays on the right.
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
          <span className="text-base/6 font-medium text-balance">
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
          <span className="text-base/6 font-medium text-balance">
            {next.title}
          </span>
        </Link>
      )}
    </nav>
  );
};
