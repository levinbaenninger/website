import Image from "next/image";
import type { StaticImageData } from "next/image";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { ArticleCopyButton } from "./article-copy-button";

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

type ArticleCodeBlockProps = ComponentPropsWithoutRef<"pre"> & {
  readonly "data-code-tab-label"?: string;
  readonly "data-code-title"?: string;
  readonly "data-copy-source"?: string;
  readonly "data-line-numbers-start"?: number;
  readonly "data-twoslash"?: string;
};

export const ArticleCodeBlock = ({
  "data-code-tab-label": _tabLabel,
  "data-code-title": title,
  "data-copy-source": copySource,
  "data-line-numbers-start": lineNumbersStart,
  "data-twoslash": twoslash,
  children,
  ...props
}: ArticleCodeBlockProps) => (
  <figure
    data-code-block=""
    data-line-numbers-start={lineNumbersStart}
    data-twoslash={twoslash}
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
