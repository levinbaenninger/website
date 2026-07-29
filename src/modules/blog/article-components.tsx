import {
  FileCode2Icon,
  FileIcon,
  FileJsonIcon,
  FolderIcon,
  FolderOpenIcon,
} from "lucide-react";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from "react";

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
  <figure>
    <Image
      alt={decorative === true ? "" : (alt ?? "")}
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
  const external = href.startsWith("https://");

  return (
    <a
      {...props}
      href={href}
      rel={external ? "noopener noreferrer" : undefined}
      target={external ? "_blank" : undefined}
    >
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

export const ArticleCallout = ({ children, kind, title }: CalloutProps) => (
  <aside
    className="group/alert relative grid w-full gap-0.5 rounded-lg border bg-card px-2.5 py-2 text-left text-sm text-card-foreground"
    data-kind={kind}
    data-slot="article-callout"
  >
    {title === undefined ? null : <AlertTitle>{title}</AlertTitle>}
    <AlertDescription>{children}</AlertDescription>
  </aside>
);

export const ArticleCards = ({
  children,
}: {
  readonly children: ReactNode;
}) => <div data-slot="article-cards">{children}</div>;

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
    <article data-slot="article-card">
      <ArticleCardContents icon={icon} title={title}>
        {children}
      </ArticleCardContents>
    </article>
  );

  return href === undefined ? (
    contents
  ) : (
    <ArticleLink href={href}>{contents}</ArticleLink>
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
        <ul>{children}</ul>
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

export const ArticleHeading2 = ({
  children,
  ...props
}: ComponentPropsWithoutRef<"h2">) => <h2 {...props}>{children}</h2>;

export const ArticleHeading3 = ({
  children,
  ...props
}: ComponentPropsWithoutRef<"h3">) => <h3 {...props}>{children}</h3>;

export const ArticleHeading4 = ({
  children,
  ...props
}: ComponentPropsWithoutRef<"h4">) => <h4 {...props}>{children}</h4>;

export const ArticleHeading5 = ({
  children,
  ...props
}: ComponentPropsWithoutRef<"h5">) => <h5 {...props}>{children}</h5>;

export const ArticleHeading6 = ({
  children,
  ...props
}: ComponentPropsWithoutRef<"h6">) => <h6 {...props}>{children}</h6>;

export const ArticleQuote = (props: ComponentPropsWithoutRef<"blockquote">) => (
  <blockquote {...props} />
);

export const ArticleTable = (props: ComponentPropsWithoutRef<"table">) => (
  <table {...props} />
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
