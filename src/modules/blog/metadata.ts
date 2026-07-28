import { Temporal } from "@js-temporal/polyfill";
import { z } from "zod";

import { resolveTag } from "./tags";
import type { Tag } from "./tags";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const LINE_BREAK_PATTERN = /[\n\r\u2028\u2029]/u;
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

const graphemeCount = (value: string): number =>
  [...segmenter.segment(value)].length;

const authoredText = (maximumLength: number) =>
  z
    .string()
    .refine((value) => value === value.trim(), "must already be trimmed")
    .refine(
      (value) => value === value.normalize("NFC"),
      "must be NFC-normalized"
    )
    .refine((value) => !LINE_BREAK_PATTERN.test(value), "must be single-line")
    .refine((value) => {
      const length = graphemeCount(value);
      return length >= 1 && length <= maximumLength;
    }, `must contain 1–${maximumLength} grapheme clusters`);

const date = z
  .string()
  .regex(DATE_PATTERN, "must use ISO YYYY-MM-DD")
  .refine((value) => {
    try {
      Temporal.PlainDate.from(value);
      return true;
    } catch {
      return false;
    }
  }, "must be a real Gregorian calendar date");

const tagId = z
  .string()
  .regex(SLUG_PATTERN, "must be a lowercase kebab-case ID");
const redirectSlug = z
  .string()
  .min(1)
  .max(80)
  .regex(SLUG_PATTERN, "must be a lowercase kebab-case slug");

const metadataShape = {
  title: authoredText(100),
  description: authoredText(240),
  updatedAt: date.optional(),
  tags: z
    .array(tagId)
    .min(1)
    .max(5)
    .refine((tags) => new Set(tags).size === tags.length, "must be unique"),
  redirectFrom: z
    .array(redirectSlug)
    .refine((slugs) => new Set(slugs).size === slugs.length, "must be unique")
    .optional(),
};

const metadataSchema = z
  .discriminatedUnion("status", [
    z
      .object({
        ...metadataShape,
        status: z.literal("Draft"),
        publishedAt: date.optional(),
      })
      .strict(),
    z
      .object({
        ...metadataShape,
        status: z.literal("Published"),
        publishedAt: date,
      })
      .strict(),
  ])
  .superRefine((metadata, context) => {
    if (
      metadata.updatedAt !== undefined &&
      metadata.publishedAt === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "updatedAt requires publishedAt",
        path: ["updatedAt"],
      });
    }

    if (
      metadata.updatedAt !== undefined &&
      metadata.publishedAt !== undefined &&
      Temporal.PlainDate.compare(metadata.updatedAt, metadata.publishedAt) < 0
    ) {
      context.addIssue({
        code: "custom",
        message: "updatedAt cannot precede publishedAt",
        path: ["updatedAt"],
      });
    }
  });

interface ValidatedArticleMetadataBase {
  readonly title: string;
  readonly description: string;
  readonly tags: readonly Tag[];
  readonly redirectFrom: readonly string[];
}

export type ValidatedArticleMetadata =
  | (ValidatedArticleMetadataBase & {
      readonly status: "Draft";
      readonly publishedAt?: string;
      readonly updatedAt?: string;
    })
  | (ValidatedArticleMetadataBase & {
      readonly status: "Published";
      readonly publishedAt: string;
      readonly updatedAt?: string;
    });

interface ValidationContext {
  readonly slug: string;
  readonly today: Temporal.PlainDate;
}

export const validateArticleMetadata = (
  input: unknown,
  { slug, today }: ValidationContext
): ValidatedArticleMetadata => {
  if (slug.length > 80 || !SLUG_PATTERN.test(slug)) {
    throw new Error(`Invalid Article slug: ${JSON.stringify(slug)}`);
  }

  const metadata = metadataSchema.parse(input);

  if (metadata.redirectFrom?.includes(slug) === true) {
    throw new Error(`Article ${JSON.stringify(slug)} redirects from itself.`);
  }

  for (const authoredDate of [metadata.publishedAt, metadata.updatedAt]) {
    if (
      authoredDate !== undefined &&
      Temporal.PlainDate.compare(authoredDate, today) > 0
    ) {
      throw new Error(
        `Article ${JSON.stringify(slug)} has a future date: ${authoredDate}`
      );
    }
  }

  const tags = metadata.tags.map((id) => {
    const tag = resolveTag(id);

    if (!tag) {
      throw new Error(
        `Article ${JSON.stringify(slug)} references unknown Tag ${JSON.stringify(id)}.`
      );
    }

    return tag;
  });
  tags.sort((left, right) => {
    if (left.label < right.label) {
      return -1;
    }
    if (left.label > right.label) {
      return 1;
    }
    return 0;
  });

  const shared = {
    title: metadata.title,
    description: metadata.description,
    tags,
    redirectFrom: metadata.redirectFrom ?? [],
  };

  if (metadata.status === "Published") {
    return {
      ...shared,
      status: metadata.status,
      publishedAt: metadata.publishedAt,
      ...(metadata.updatedAt === undefined
        ? {}
        : { updatedAt: metadata.updatedAt }),
    };
  }

  return {
    ...shared,
    status: metadata.status,
    ...(metadata.publishedAt === undefined
      ? {}
      : { publishedAt: metadata.publishedAt }),
    ...(metadata.updatedAt === undefined
      ? {}
      : { updatedAt: metadata.updatedAt }),
  };
};
