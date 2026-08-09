import { createBlogIdentity } from "@/features/blog/identity";

export const createBlogCatalogMetadata = (siteName: string) => {
  const blog = createBlogIdentity(siteName);

  return {
    canonicalHref: "/blog" as const,
    description: blog.description,
    rss: {
      href: "/blog/rss.xml" as const,
      mediaType: "application/rss+xml" as const,
    },
    title: blog.title,
  };
};
