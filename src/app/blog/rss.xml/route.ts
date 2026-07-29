import { listPublishedArticleDiscoveryEntries } from "@/app/_blog/articles/server";
import { createRssResponse } from "@/app/_blog/discovery/rss";

export const dynamic = "force-static";

export const GET = async (): Promise<Response> =>
  createRssResponse(await listPublishedArticleDiscoveryEntries());
