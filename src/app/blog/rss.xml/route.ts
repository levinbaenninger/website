import { createRssResponse } from "@/app/_blog/rss";
import { listPublishedArticleDiscoveryEntries } from "@/app/_blog/server";

export const dynamic = "force-static";

export const GET = async (): Promise<Response> =>
  createRssResponse(await listPublishedArticleDiscoveryEntries());
