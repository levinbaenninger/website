import { z } from "zod";

import type { ArticleSearchDocument } from "@/modules/blog/articles/types";

export const ARTICLE_SEARCH_SCHEMA_VERSION = 1 as const;

const normalizedTextSchema = z
  .string()
  .min(1)
  .refine((value) => value === value.normalize("NFC"), "Text must use NFC.");

const normalizedBodySchema = z
  .string()
  .refine((value) => value === value.normalize("NFC"), "Body must use NFC.")
  .refine(
    (value) => value === value.replaceAll(/\s+/gu, " ").trim(),
    "Body whitespace must be normalized."
  );

const tagSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
    label: normalizedTextSchema,
  })
  .strict();

const articleHrefSchema = z.custom<`/blog/${string}`>(
  (value) =>
    typeof value === "string" &&
    /^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value),
  "Invalid canonical Article href."
);

const documentSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
    href: articleHrefSchema,
    title: normalizedTextSchema,
    description: normalizedTextSchema,
    tags: z.array(tagSchema),
    headings: z.array(normalizedTextSchema),
    body: normalizedBodySchema,
    status: z.enum(["published", "draft"]),
  })
  .strict();

const artifactSchema = z
  .object({
    schemaVersion: z.literal(ARTICLE_SEARCH_SCHEMA_VERSION),
    documents: z.array(documentSchema),
  })
  .strict();

export interface ArticleSearchArtifact {
  readonly schemaVersion: typeof ARTICLE_SEARCH_SCHEMA_VERSION;
  readonly documents: readonly ArticleSearchDocument[];
}

export const compareArticleSearchIds = (
  left: string,
  right: string
): number => {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
};

const validateDocumentIdentity = (
  documents: readonly ArticleSearchDocument[]
): void => {
  const ids = new Set<string>();
  let previousId: string | undefined;

  for (const document of documents) {
    if (previousId !== undefined && previousId >= document.id) {
      throw new Error(
        "Article search documents must use unique ids in canonical slug order."
      );
    }
    if (document.href !== `/blog/${document.id}`) {
      throw new Error(
        `Article search document href must agree with id ${JSON.stringify(document.id)}.`
      );
    }
    if (ids.has(document.id)) {
      throw new Error("Article search document ids must be unique.");
    }
    ids.add(document.id);
    previousId = document.id;
  }
};

export const parseArticleSearchArtifact = (
  value: unknown
): ArticleSearchArtifact => {
  if (
    typeof value === "object" &&
    value !== null &&
    "schemaVersion" in value &&
    value.schemaVersion !== ARTICLE_SEARCH_SCHEMA_VERSION
  ) {
    throw new Error("Unsupported Article search artifact schema version.");
  }

  const result = artifactSchema.safeParse(value);
  if (!result.success) {
    throw new Error(
      `Article search artifact is invalid: ${z.prettifyError(result.error)}`
    );
  }

  validateDocumentIdentity(result.data.documents);
  return result.data;
};

export const createArticleSearchArtifact = (
  documents: readonly ArticleSearchDocument[]
): ArticleSearchArtifact =>
  parseArticleSearchArtifact({
    schemaVersion: ARTICLE_SEARCH_SCHEMA_VERSION,
    documents: documents.toSorted((left, right) =>
      compareArticleSearchIds(left.id, right.id)
    ),
  });

export const serializeArticleSearchArtifact = (
  documents: readonly ArticleSearchDocument[]
): string => `${JSON.stringify(createArticleSearchArtifact(documents))}\n`;
