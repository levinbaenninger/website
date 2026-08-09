import {
  ArrowUpRightIcon,
  FileCode2Icon,
  FileIcon,
  FileJsonIcon,
  FolderIcon,
  FolderOpenIcon,
  InfoIcon,
  LightbulbIcon,
  OctagonAlertIcon,
  TriangleAlertIcon,
} from "lucide-react";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import Link from "next/link";
import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  ReactElement,
  ReactNode,
} from "react";

import { AlertDescription, AlertTitle } from "@/shared/ui/alert";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import { Kbd } from "@/shared/ui/kbd";

import { ArticleCopyButton } from "./code/copy-button";
import { ArticleTwoslashScope } from "./code/twoslash";
import { ArticleHeadingCopyLink } from "./heading-copy";

interface FigureProps {
  readonly alt?: string;
  readonly children?: ReactNode;
  readonly decorative?: boolean;
  readonly src: StaticImageData;
}

/*
 * The Article rail is at most 48rem wide and the Figure fills it, so `sizes`
 * says exactly that. Without it Next emits a 1x/2x srcset built for a
 * fixed-size image; with it the browser picks a width-appropriate candidate,
 * which is the difference between the responsive pipeline running and merely
 * being present.
 *
 * The intrinsic width and height come from the static import — the contract
 * only accepts an imported Article-local binding — so the box is reserved
 * before the bytes arrive and nothing shifts while it loads. An SVG has no
 * raster sizes to pick from, so it stays unoptimized.
 */
export const ArticleFigure = ({
  alt,
  children,
  decorative,
  src,
}: FigureProps) => (
  <figure data-slot="article-figure">
    <Image
      alt={decorative === true ? "" : (alt ?? "")}
      sizes="(min-width: 48rem) 48rem, 100vw"
      src={src}
      unoptimized={src.src.endsWith(".svg")}
    />
    {children === undefined ? null : <figcaption>{children}</figcaption>}
  </figure>
);

/*
 * Three destinations, three behaviors, all decided by the compiled href — the
 * contract already restricts an authored link to a same-Article fragment, a
 * root-relative path, or an absolute HTTPS URL, so there is no fourth case.
 *
 * A fragment stays a plain anchor: it is same-document navigation, and routing
 * it through the router would replace the browser's own behavior with a slower
 * copy of it. A root-relative path is an in-app destination and takes the
 * client-side transition. An external destination opens in a new tab and says
 * so — with an icon *and* a name, because a mark no screen reader can reach is
 * not a mark, and colour alone is not a mark either.
 */
export const ArticleLink = ({
  children,
  href = "",
  ...props
}: ComponentPropsWithoutRef<"a">) => {
  if (href.startsWith("https://")) {
    return (
      <a {...props} href={href} rel="noopener noreferrer" target="_blank">
        {children}
        <ArrowUpRightIcon aria-hidden data-article-external-mark="" />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }

  if (href.startsWith("/")) {
    return (
      <Link {...props} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <a {...props} href={href}>
      {children}
    </a>
  );
};

export const ArticleTaskInput = (props: ComponentPropsWithoutRef<"input">) => (
  <input {...props} disabled type="checkbox" />
);

interface CalloutProps {
  readonly children: ReactNode;
  readonly kind: "danger" | "note" | "tip" | "warning";
  readonly title?: string;
}

const calloutMarks = {
  danger: OctagonAlertIcon,
  note: InfoIcon,
  tip: LightbulbIcon,
  warning: TriangleAlertIcon,
};

const calloutLabels = {
  danger: "Danger",
  note: "Note",
  tip: "Tip",
  warning: "Warning",
};

/*
 * A Callout is static content, so it is an `aside` rather than shadcn's `Alert`:
 * `Alert` carries `role="alert"`, and an assertive live region on prose that was
 * there when the page loaded interrupts a screen reader for nothing. The title
 * and description slots are reused, which is the whole of what "Alert-backed"
 * buys — a shared spacing and typography contract.
 *
 * The kind reaches the reader on three channels, and the tint is only the third
 * of them: a real icon for the sighted reader, the kind's own word for anyone
 * who cannot see it, and the colour on top of both. `data-kind` stays on the
 * element because `article.css` keys the tint and the mark's colour off it.
 */
export const ArticleCallout = ({ children, kind, title }: CalloutProps) => {
  const Mark = calloutMarks[kind];

  return (
    <aside data-kind={kind} data-slot="article-callout">
      <Mark aria-hidden data-slot="article-callout-mark" />
      <span className="sr-only">{calloutLabels[kind]}: </span>
      {title === undefined ? null : <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </aside>
  );
};

/*
 * A Card collection is a list of things, so it is a list. The `li` is the Card,
 * which is why there is no inner `article` — a second element announcing itself
 * around every tile says nothing the list item did not already say.
 */
export const ArticleCards = ({
  children,
}: {
  readonly children: ReactNode;
}) => <ul data-slot="article-cards">{children}</ul>;

interface ArticleCardProps {
  readonly children?: ReactNode;
  readonly href?: string;
  readonly icon?: ReactElement;
  readonly title: string;
}

const ArticleCardContents = ({
  children,
  icon,
  title,
}: Omit<ArticleCardProps, "href">) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      {icon === undefined ? null : <CardAction>{icon}</CardAction>}
    </CardHeader>
    {children === undefined ? null : <CardContent>{children}</CardContent>}
  </Card>
);

/*
 * A linked Card is exactly one link wrapping the whole tile, which is what the
 * contract's `card-interactive` rule already guarantees by rejecting any other
 * interactive content inside it. An unlinked Card is not a target and gets no
 * pointer feedback: `article.css` reacts to the anchor, never to the item.
 */
export const ArticleCard = ({
  children,
  href,
  icon,
  title,
}: ArticleCardProps) => {
  const contents = (
    <ArticleCardContents icon={icon} title={title}>
      {children}
    </ArticleCardContents>
  );

  return (
    <li data-slot="article-card">
      {href === undefined ? (
        contents
      ) : (
        <ArticleLink href={href}>{contents}</ArticleLink>
      )}
    </li>
  );
};

export const ArticleFiles = ({
  children,
}: {
  readonly children: ReactNode;
}) => <ul data-slot="article-files">{children}</ul>;

const inferFileKind = (name: string): string => {
  const extension = name.includes(".") ? name.split(".").at(-1) : undefined;
  return extension?.toLowerCase() ?? "file";
};

const ArticleFileIcon = ({ kind }: { readonly kind: string }) => {
  if (kind === "json") {
    return <FileJsonIcon aria-hidden />;
  }
  if (["js", "jsx", "ts", "tsx"].includes(kind)) {
    return <FileCode2Icon aria-hidden />;
  }
  return <FileIcon aria-hidden />;
};

export const ArticleFile = ({ name }: { readonly name: string }) => {
  const kind = inferFileKind(name);
  return (
    <li data-file-kind={kind} data-slot="article-file">
      <ArticleFileIcon kind={kind} />
      <span>{name}</span>
    </li>
  );
};

interface ArticleFolderProps {
  readonly children?: ReactNode;
  readonly defaultOpen?: boolean;
  readonly name: string;
}

export const ArticleFolder = ({
  children,
  defaultOpen,
  name,
}: ArticleFolderProps) => (
  <li data-slot="article-folder">
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger aria-label={`${name} folder`}>
        <FolderIcon aria-hidden data-state-icon="closed" />
        <FolderOpenIcon aria-hidden data-state-icon="open" />
        <span>{name}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul data-slot="article-folder-entries">{children}</ul>
      </CollapsibleContent>
    </Collapsible>
  </li>
);

export const ArticleSteps = ({
  children,
}: {
  readonly children: ReactNode;
}) => <ol data-slot="article-steps">{children}</ol>;

interface ArticleStepProps {
  readonly children: ReactNode;
  readonly title: string;
}

export const ArticleStep = ({ children, title }: ArticleStepProps) => (
  <li data-slot="article-step">
    <div data-slot="article-step-title">{title}</div>
    <div data-slot="article-step-content">{children}</div>
  </li>
);

export const ArticleKbd = ({ children }: { readonly children: string }) => (
  <Kbd>{children}</Kbd>
);

type ArticleCodeBlockProps = ComponentPropsWithoutRef<"pre"> & {
  readonly "data-code-name"?: string;
  readonly "data-code-tab-label"?: string;
  readonly "data-code-title"?: string;
  readonly "data-copy-source"?: string;
  readonly "data-line-numbers-start"?: number;
  readonly "data-twoslash"?: string;
  readonly "data-twoslash-internal"?: string;
};

/*
 * The line-number start reaches CSS as a custom property, because the gutter is
 * a counter and a counter needs its origin as a number. A declared interface
 * rather than an assertion: `style` accepts any subtype of `CSSProperties`, so
 * naming the property is enough to keep it typed.
 */
interface ArticleCodeBlockStyle extends CSSProperties {
  readonly "--line-start"?: number;
}

/*
 * `pre` is a global Article mapping, so every `pre` in the compiled tree arrives
 * here — including the one Twoslash's rich renderer emits for a fenced example
 * inside a hover popup. That one already sits inside a frame of its own, and
 * wrapping it again produced a surface, a ring and a copy control nested in the
 * popup's own card, with a `max-content` width that stopped an inferred
 * signature from ever wrapping. The compiler marks it; here it passes straight
 * through as the plain `pre` it is.
 *
 * Everything else becomes the frame: an optional ruled title bar, the copy
 * control, and a compiler-derived accessible name — the language, plus the title
 * when the author gave one — so the figure announces what it holds instead of
 * presenting an unnamed region.
 *
 * The frame stays a Server Component. Only the copy control and the Twoslash pin
 * scope are client leaves, and the scope is mounted solely for a block that
 * actually carries Twoslash markup: it is what makes "one pinned popup" a
 * property of a CodeBlock rather than of the page.
 */
export const ArticleCodeBlock = ({
  "data-code-name": name,
  "data-code-tab-label": _tabLabel,
  "data-code-title": title,
  "data-copy-source": copySource,
  "data-line-numbers-start": lineNumbersStart,
  "data-twoslash": twoslash,
  "data-twoslash-internal": twoslashInternal,
  children,
  ...props
}: ArticleCodeBlockProps) => {
  if (twoslashInternal !== undefined) {
    return <pre {...props}>{children}</pre>;
  }

  const style: ArticleCodeBlockStyle | undefined =
    lineNumbersStart === undefined
      ? undefined
      : { "--line-start": lineNumbersStart };

  const frame = (
    <figure
      aria-label={name}
      data-code-block=""
      data-line-numbers-start={lineNumbersStart}
      data-twoslash={twoslash}
      style={style}
    >
      {title === undefined && copySource === undefined ? null : (
        <figcaption>
          {title === undefined ? null : <span>{title}</span>}
          {copySource === undefined ? null : (
            <ArticleCopyButton source={copySource} />
          )}
        </figcaption>
      )}
      <pre {...props}>{children}</pre>
    </figure>
  );

  return twoslash === undefined ? (
    frame
  ) : (
    <ArticleTwoslashScope>{frame}</ArticleTwoslashScope>
  );
};

/*
 * The heading text *is* its own fragment link, with the copy-link control beside
 * it. That shape needs no extra affordance to explain itself and no extra tab
 * stop to reach, and it is the reference's own.
 *
 * The `id` is the compiler's, deterministic and already deduplicated by
 * `github-slugger`, so the link can be written without knowing anything about
 * the Article. A heading compiled without one — which the contract does not
 * produce — degrades to plain text rather than to a broken link.
 *
 * The language stops at h4: `contract.ts` rejects h1 above it and h5/h6 below,
 * so these three are the complete set.
 */
const ArticleHeadingContent = ({
  children,
  id,
}: {
  readonly children: ReactNode;
  readonly id: string | undefined;
}): ReactNode =>
  id === undefined ? (
    children
  ) : (
    <>
      <a data-article-heading-anchor="" href={`#${id}`}>
        {children}
      </a>
      <ArticleHeadingCopyLink id={id} />
    </>
  );

export const ArticleHeading2 = ({
  children,
  ...props
}: ComponentPropsWithoutRef<"h2">) => (
  <h2 {...props}>
    <ArticleHeadingContent id={props.id}>{children}</ArticleHeadingContent>
  </h2>
);

export const ArticleHeading3 = ({
  children,
  ...props
}: ComponentPropsWithoutRef<"h3">) => (
  <h3 {...props}>
    <ArticleHeadingContent id={props.id}>{children}</ArticleHeadingContent>
  </h3>
);

export const ArticleHeading4 = ({
  children,
  ...props
}: ComponentPropsWithoutRef<"h4">) => (
  <h4 {...props}>
    <ArticleHeadingContent id={props.id}>{children}</ArticleHeadingContent>
  </h4>
);

export const ArticleQuote = (props: ComponentPropsWithoutRef<"blockquote">) => (
  <blockquote {...props} />
);

/*
 * A wide table scrolls inside the rail instead of compressing its columns into
 * unreadable ones, and it cannot be a rule: `.typeset-scroll` needs a wrapper
 * element, and CSS cannot add one.
 *
 * The region is focusable so a keyboard can scroll it. That costs a tab stop on
 * every table, including narrow ones that never overflow — the alternative is
 * content only a pointer can reach, which is worse. A named `section` is a
 * region, and the name is what makes the stop announce itself as something
 * rather than as an unlabelled box.
 */
export const ArticleTable = (props: ComponentPropsWithoutRef<"table">) => (
  <section
    aria-label="Table"
    className="typeset-scroll"
    data-article-table=""
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Scrollable overflow has to be reachable without a pointer.
    tabIndex={0}
  >
    <table {...props} />
  </section>
);

export const ArticleTableHead = (props: ComponentPropsWithoutRef<"thead">) => (
  <thead {...props} />
);

export const ArticleTableBody = (props: ComponentPropsWithoutRef<"tbody">) => (
  <tbody {...props} />
);

export const ArticleTableRow = (props: ComponentPropsWithoutRef<"tr">) => (
  <tr {...props} />
);

export const ArticleTableHeading = (props: ComponentPropsWithoutRef<"th">) => (
  <th {...props} />
);

export const ArticleTableCell = (props: ComponentPropsWithoutRef<"td">) => (
  <td {...props} />
);

export const ArticleThematicBreak = (props: ComponentPropsWithoutRef<"hr">) => (
  <hr {...props} />
);
