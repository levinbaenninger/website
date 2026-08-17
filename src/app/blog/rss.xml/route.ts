import {
  AUTHOR_IDENTITY,
  SITE_IDENTITY,
  toCanonicalUrl,
} from "@/app/_config/site-identity";
import { listPublishedArticleDiscoveryEntries } from "@/app/blog/_articles/server";
import { serializeRss } from "@/features/blog/discovery/rss";
import { createBlogIdentity } from "@/features/blog/identity";

export const dynamic = "force-static";

export const GET = async (): Promise<Response> => {
  const blog = createBlogIdentity(SITE_IDENTITY.name);

  return new Response(
    serializeRss(await listPublishedArticleDiscoveryEntries(), {
      author: AUTHOR_IDENTITY,
      canonicalUrl: toCanonicalUrl,
      description: blog.description,
      name: blog.name,
    }),
    {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "X-Robots-Tag": "noindex, follow",
      },
    }
  );
};
