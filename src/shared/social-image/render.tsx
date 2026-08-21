import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";
import type { CSSProperties } from "react";

import type { SocialImageInput } from ".";

export const SOCIAL_IMAGE_SIZE = {
  height: 630,
  width: 1200,
} as const;

export const SOCIAL_IMAGE_CONTENT_TYPE = "image/png";

const INK = "#fafafa";
const MUTED = "#a1a1aa";
const FAINT = "#52525b";
const RULE = "#3f3f46";
const HAIRLINE = "#27272a";
const CANVAS = "#09090b";

/* Satori resolves `oklch()` to the wrong colour, so the theme tokens are
   mirrored as hex here. Keep in step with `--background` and friends. */

const RAIL_WIDTH = 348;
const TITLE_PADDING_LEFT = 64;
/* The layout contract keeps title ink left of x=1119. A 64px gutter puts an
   unbroken title at x=1110 — one glyph from the limit — so the right side is
   wider than the left on purpose. */
const TITLE_PADDING_RIGHT = 88;
const TITLE_COLUMN_WIDTH =
  SOCIAL_IMAGE_SIZE.width -
  RAIL_WIDTH -
  TITLE_PADDING_LEFT -
  TITLE_PADDING_RIGHT;
const TITLE_LINES = 4;
const TITLE_LINE_HEIGHT = 1.06;
const TITLE_MAX_CHARACTERS = 96;

const assetPath = (file: string): string =>
  path.join(process.cwd(), "src/shared/social-image/assets", file);

const sansBytes = await readFile(assetPath("Geist-Regular.ttf"));
const monoBytes = await readFile(assetPath("GeistMono-Regular.ttf"));
const avatarBytes = await readFile(assetPath("author-avatar.png"));

const sansData = Uint8Array.from(sansBytes).buffer;
const monoData = Uint8Array.from(monoBytes).buffer;
const avatarUri = `data:image/png;base64,${avatarBytes.toString("base64")}`;

const stripesStyle = {
  backgroundImage: `repeating-linear-gradient(315deg, ${HAIRLINE} 0, ${HAIRLINE} 1px, transparent 0, transparent 50%)`,
  backgroundSize: "10px 10px",
  display: "flex",
} as const satisfies CSSProperties;

const titleFontSize = (title: string): number => {
  if (title.length > 70) {
    return 52;
  }
  if (title.length > 44) {
    return 66;
  }
  return 78;
};

const truncateTitle = (title: string): string =>
  title.length > TITLE_MAX_CHARACTERS
    ? `${title.slice(0, TITLE_MAX_CHARACTERS - 1).trimEnd()}…`
    : title;

/* Satori applies `break-word` eagerly and breaks ordinary words mid-glyph, so
   it is only worth the damage when a single token cannot fit the column. The
   0.62em factor approximates Geist's widest glyphs. */
const needsHardBreak = (title: string, fontSize: number): boolean => {
  const longestWord = Math.max(
    ...title.split(/\s+/u).map((word) => word.length)
  );
  return longestWord * fontSize * 0.62 > TITLE_COLUMN_WIDTH;
};

interface TitleStyle extends CSSProperties {
  readonly lineClamp: number;
  readonly textWrap: "balance";
}

const titleStyle = (title: string): TitleStyle => {
  const fontSize = titleFontSize(title);
  const hardBreak = needsHardBreak(title, fontSize);
  return {
    /* A hard-broken title overflows its clamp, so anchor it to the top and let
       the clipping happen at the bottom edge instead of slicing both ends. */
    alignItems: hardBreak ? "flex-start" : "center",
    display: "flex",
    fontSize,
    /* Without an explicit width Satori sizes the box below the column and
       `overflow: hidden` clips whole words. */
    width: "100%",
    height: Math.round(fontSize * TITLE_LINE_HEIGHT * TITLE_LINES),
    lineClamp: TITLE_LINES,
    lineHeight: TITLE_LINE_HEIGHT,
    overflow: "hidden",
    textOverflow: "ellipsis",
    textWrap: "balance",
    wordBreak: hardBreak ? "break-word" : "normal",
  };
};

const MonoText = ({
  children,
  color = FAINT,
  fontSize = 18,
  letterSpacing = 2,
}: {
  readonly children: string;
  readonly color?: string;
  readonly fontSize?: number;
  readonly letterSpacing?: number;
}) => (
  <div
    style={{
      color,
      display: "flex",
      fontFamily: "Social Geist Mono",
      fontSize,
      letterSpacing,
    }}
  >
    {children}
  </div>
);

const MetaRow = ({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) => (
  <div
    style={{
      borderBottom: `1px dashed ${HAIRLINE}`,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      padding: "22px 28px",
    }}
  >
    <MonoText fontSize={16} letterSpacing={3}>
      {label}
    </MonoText>
    <div style={{ color: MUTED, display: "flex", fontSize: 23 }}>{value}</div>
  </div>
);

/* The author's name belongs to the identity cell alone — repeating it in a
   meta row printed it twice on every card. Articles spend the second row on
   the site, everything else on its tagline. */
const secondRow = ({ site, tagline }: SocialImageInput) =>
  tagline === undefined ? (
    <MetaRow label="SITE" value={site} />
  ) : (
    <MetaRow label="ABOUT" value={tagline} />
  );

export const renderSocialImage = (input: SocialImageInput): ImageResponse => {
  const { author, label, title } = input;
  return new ImageResponse(
    <div
      style={{
        backgroundColor: CANVAS,
        color: INK,
        display: "flex",
        fontFamily: "Social Geist",
        height: "100%",
        width: "100%",
      }}
    >
      <div
        style={{
          borderRight: `1px solid ${RULE}`,
          display: "flex",
          flexDirection: "column",
          width: RAIL_WIDTH,
        }}
      >
        <div
          style={{
            alignItems: "center",
            borderBottom: `1px solid ${RULE}`,
            display: "flex",
            gap: 18,
            height: 132,
            padding: "0 36px",
          }}
        >
          {/* Satori has no `next/image`; it rasterises plain `img` elements. */}
          {/* oxlint-disable-next-line next/no-img-element */}
          <img
            alt=""
            height={60}
            src={avatarUri}
            style={{ borderRadius: 999 }}
            width={60}
          />
          <div style={{ display: "flex", fontSize: 24 }}>{author}</div>
        </div>
        <MetaRow label="TYPE" value={label.toUpperCase()} />
        {secondRow(input)}
        <div style={{ ...stripesStyle, flex: 1 }} />
      </div>
      <div style={{ display: "flex", flex: 1, flexDirection: "column" }}>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flex: 1,
            padding: `0 ${TITLE_PADDING_RIGHT}px 0 ${TITLE_PADDING_LEFT}px`,
          }}
        >
          <div style={titleStyle(title)}>{truncateTitle(title)}</div>
        </div>
        <div
          style={{
            alignItems: "center",
            borderTop: `1px solid ${RULE}`,
            display: "flex",
            height: 96,
            padding: `0 ${TITLE_PADDING_LEFT}px`,
          }}
        >
          <MonoText>FIG_001</MonoText>
          <div style={{ display: "flex", flex: 1 }} />
          <MonoText>
            {`${SOCIAL_IMAGE_SIZE.width} × ${SOCIAL_IMAGE_SIZE.height}`}
          </MonoText>
        </div>
      </div>
    </div>,
    {
      ...SOCIAL_IMAGE_SIZE,
      fonts: [
        {
          data: sansData,
          name: "Social Geist",
          style: "normal",
          weight: 400,
        },
        {
          data: monoData,
          name: "Social Geist Mono",
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
};
