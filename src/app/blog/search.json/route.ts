import { createArticleSearchResponse } from "@/app/_blog/search-route";
import { listArticleSearchDocuments } from "@/app/_blog/server";

export const dynamic = "force-static";

export const GET = async (): Promise<Response> =>
  createArticleSearchResponse(await listArticleSearchDocuments());
