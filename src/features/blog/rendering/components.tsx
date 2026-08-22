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

// Callout is an aside, not Alert: role=alert on static prose would interrupt a screen reader.
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

interface ArticleCodeBlockStyle extends CSSProperties {
  readonly "--line-start"?: number;
}

// `pre` is a global mapping, including Twoslash; data-twoslash-internal passes through as a plain pre.
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
