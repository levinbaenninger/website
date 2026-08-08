// Everything the Article reader puts around authored Article content: the
// lined rail, the sticky toolbar, the typographic header, the prose column, and
// the neighbour pager. All of it renders on the server — the toolbar's copy of
// the title is the only piece that needs a scroll position, and it lives in its
// own island.
//
// Composition accepted on #33 (variant C) and specified on #36. Transposed from
// ncdai/chanhdai.com @ 83e0b842 (MIT, © Chánh Đại): `app/blog/[slug]/page.tsx`,
// `src/features/doc/components/doc-layout.tsx`, `doc-page-root.tsx`.

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { formatArticleDate } from "@/modules/blog/articles/article-date";
import type {
  ArticleNeighbourLink,
  ArticleReaderNavigation,
  ArticleSummary,
} from "@/modules/blog/articles/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/ui/cn";

import { ARTICLE_TITLE_SLOT } from "./reader-contract";
import { ArticleShareMenu } from "./share-menu";
import { StickyArticleTitle } from "./sticky-title";

/** The 48 rem lined rail every part of the reader is measured against. */
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

/**
 * The 16 px lined strip between the toolbar and the title.
 *
 * `screen-line-top-none` because `screen-line-top` is a `::before` at `top: 0`
 * and `screen-line-bottom` an `::after` at `bottom: 0`: stacked directly under
 * the toolbar's own bottom rule they draw two adjacent 1 px lines. The toolbar
 * owns that rule, and it is the one that has to survive scrolling.
 */
const ReaderTitleSpacer = () => (
  <div className="screen-line-bottom py-px screen-line-top-none">
    <div className="h-4" />
  </div>
);

export const ReaderBottomLine = () => <div className="screen-line-top h-4" />;

/**
 * Back to the Blog catalog.
 *
 * A real `/blog` destination, never `history.back()`: a control that claims a
 * destination has to go there whether or not the reader arrived from it. The
 * visible word is "Blog" and the accessible name says where it goes.
 *
 * Prefetch is off. The link is on screen at every scroll position, and a
 * visitor who arrived from the catalog already has it; one who arrived directly
 * has no reason to download it before deciding to leave.
 */
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

/** Icon-only Previous/Next, on the same always-visible prefetch policy. */
const ToolbarNeighbourLink = ({
  direction,
  neighbour,
}: {
  readonly direction: "previous" | "next";
  readonly neighbour: ArticleNeighbourLink;
}) => (
  <Button
    asChild
    className="size-7 border-none"
    size="icon-sm"
    variant="secondary"
  >
    <Link
      aria-label={
        direction === "previous" ? "Previous Article" : "Next Article"
      }
      href={neighbour.href}
      prefetch={false}
    >
      {direction === "previous" ? (
        <ArrowLeftIcon aria-hidden />
      ) : (
        <ArrowRightIcon aria-hidden />
      )}
    </Link>
  </Button>
);

/**
 * The toolbar's action cluster: Share, then the neighbour links.
 *
 * An unavailable neighbour is omitted rather than disabled: a control that
 * cannot do anything is noise in the tab order. Share is omitted on the same
 * grounds whenever there is no canonical URL — the local Draft case, where the
 * only link the menu could offer is one nobody else can open.
 */
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

/**
 * The 44 px reader toolbar, sticky under the 48 px site header.
 *
 * Equal `flex-1 basis-0` shoulders centre the title on the bar rather than in
 * whatever space the Blog link leaves over, and they hold their width whether
 * the title is showing or not, so the action cluster never shifts as it fades
 * in. Where the bar is too narrow for that — a long title on a phone — the
 * shoulders bottom out at their content widths and the title truncates and
 * drifts off centre instead of colliding with either side.
 */
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

/** The Article title: the page's only `h1`, balanced and never clamped. */
const ArticleTitle = ({ children }: { readonly children: string }) => (
  <h1
    className="screen-line-bottom px-4 font-heading text-4xl font-medium tracking-tight text-balance"
    data-slot={ARTICLE_TITLE_SLOT}
  >
    {children}
  </h1>
);

/**
 * Dates, Tags and Draft state.
 *
 * A Published Article names its publication date, and an update only when it
 * says something the publication date does not — an `updatedAt` equal to
 * `publishedAt` is validated as legal and is redundant on screen. A local Draft
 * says it is unpublished in words instead of showing a date it has not earned;
 * retained historical dates stay out of the reader entirely.
 *
 * Tags are inert Badges in the resolved label order. They are a catalog filter,
 * and a link here would send a reader out of the Article they opened.
 */
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

/**
 * The lined band under the title: the complete description, then the facts.
 *
 * `gap-2` inside against `py-4` outside — 8 px against 16 px. At equal
 * distances the description and the facts read as three unrelated lines rather
 * than one block. The Article header carries no Cover; a Cover represents an
 * Article to someone deciding whether to open it, which the reader has done.
 */
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

/**
 * The full-width reader grid: the rail stays centred and the outline gets the
 * right gutter.
 *
 * The left gutter stays empty and inert, and so does the right one when there is
 * no outline to put in it — an Article with one heading or none reclaims the
 * space rather than reserving it for a control that will never appear.
 *
 * The minimap sticks 12 px below the 92 px chrome, which is the offset the
 * prose column's own first line sits at, so the bars read as the left edge of
 * the section they describe.
 */
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

/**
 * The prose column.
 *
 * The column states its own opening offset rather than inheriting whatever
 * margin the first authored block happens to carry: `pt-8` plus an explicit
 * reset on the body's first block is 32 px under the rule whatever an author
 * opens with. `pb-8` is not a mirror of it — the first block's margin is
 * collapsed away and the last block has none, so 32 px of padding is what makes
 * the closing line sit like the opening one.
 */
export const ProseColumn = ({
  children,
}: {
  readonly children: React.ReactNode;
}) => (
  <div className="px-4 pt-8 pb-8 [&>[data-slot=article-body]>:first-child]:mt-0">
    {children}
  </div>
);

/**
 * Titled Previous/Next cells after the prose.
 *
 * The reference Article ends at the prose; this pager is Levin's own. Titles
 * are complete and unclamped — the point of the pager is that it says what the
 * neighbour is, which is the one thing the toolbar icons cannot. Below `sm` the
 * cells stack; from `sm` a missing Previous keeps its empty cell so that Next
 * stays on the right, where direction means something.
 *
 * These links keep default prefetch. They are a duplicate of controls the
 * toolbar already carries, so nothing is prepared until a reader has scrolled
 * far enough to make the navigation likely.
 */
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
