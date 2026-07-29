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

const fontBytes = await readFile(
  path.join(process.cwd(), "src/shared/social-image/assets/Geist-Regular.ttf")
);
const fontData = Uint8Array.from(fontBytes).buffer;

interface BoundedTitleStyle extends CSSProperties {
  readonly lineClamp: number;
  readonly textWrap: "balance";
}

const boundedTitleStyle = {
  display: "flex",
  fontSize: 86,
  height: 370,
  lineClamp: 4,
  lineHeight: 1.04,
  overflow: "hidden",
  textOverflow: "ellipsis",
  textWrap: "balance",
  wordBreak: "break-word",
} as const satisfies BoundedTitleStyle;

export const renderSocialImage = ({
  label,
  title,
}: SocialImageInput): ImageResponse =>
  new ImageResponse(
    <div
      style={{
        backgroundColor: "#09090b",
        color: "#fafafa",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Social Geist",
        gap: 36,
        height: "100%",
        padding: "72px 80px",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          color: "#a1a1aa",
          display: "flex",
          fontSize: 26,
          gap: 18,
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        <div
          style={{
            backgroundColor: "#fafafa",
            borderRadius: 999,
            display: "flex",
            height: 14,
            width: 14,
          }}
        />
        {label}
      </div>
      <div style={boundedTitleStyle}>{title}</div>
    </div>,
    {
      ...SOCIAL_IMAGE_SIZE,
      fonts: [
        {
          data: fontData,
          name: "Social Geist",
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
