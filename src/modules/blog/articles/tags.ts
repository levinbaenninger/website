export interface Tag {
  readonly id: string;
  readonly label: string;
}

export const TAGS = [
  { id: "nextjs", label: "Next.js" },
  { id: "react", label: "React" },
  { id: "testing", label: "Testing" },
  { id: "typescript", label: "TypeScript" },
  { id: "web-performance", label: "Web performance" },
] as const satisfies readonly Tag[];

const tagsById = new Map<string, Tag>(TAGS.map((tag) => [tag.id, tag]));

export const resolveTag = (id: string): Tag | undefined => tagsById.get(id);
