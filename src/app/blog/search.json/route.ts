import { listArticleSearchDocuments } from "@/app/_blog/articles/server";
import { createArticleSearchResponse } from "@/app/_blog/search/route";

export const dynamic = "force-static";

export const GET = async (): Promise<Response> =>
  createArticleSearchResponse(await listArticleSearchDocuments());
